from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models, schemas
from auth import hash_password, verify_password, create_access_token
from utils.health import calculate_bmi, classify_bp
from services.recommender import recommend_foods
from fastapi.security import OAuth2PasswordBearer
from jose import jwt

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hypertension Diet API with Auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------- AUTH --------

@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user.email,
        password=hash_password(user.password),
        age=user.age,
        weight=user.weight,
        height=user.height,
        smoking=user.smoking,
        alcohol=user.alcohol
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created"}


@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"user_id": db_user.id})

    return {"access_token": token, "token_type": "bearer"}


# -------- GET CURRENT USER --------
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# -------- DAILY ENTRY --------
@app.post("/daily", response_model=schemas.DailyRecommendationResponse)
def daily(entry: schemas.DailyInput,
          db: Session = Depends(get_db),
          user=Depends(get_current_user)):

    bmi = calculate_bmi(user.weight, user.height)
    bp_category = classify_bp(entry.systolic_bp, entry.diastolic_bp)

    record = models.DailyHealth(
        user_id=user.id,
        date=entry.date,
        systolic_bp=entry.systolic_bp,
        diastolic_bp=entry.diastolic_bp,
        bmi=bmi,
        bp_category=bp_category
    )

    db.add(record)
    db.commit()

    foods = recommend_foods(bp_category, bmi)

    return {
        "date": entry.date,
        "bp_category": bp_category,
        "bmi": bmi,
        "recommended_foods": foods
    }


# -------- HISTORY --------
@app.get("/history")
def history(db: Session = Depends(get_db),
            user=Depends(get_current_user)):
    records = db.query(models.DailyHealth).filter(
        models.DailyHealth.user_id == user.id
    ).all()

    return records