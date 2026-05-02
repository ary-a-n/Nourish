from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import sessionmaker, declarative_base

# Define SQLite database file path
DATABASE_URL = "sqlite:///data.sqlite3"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define User model for authentication
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    mobile = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)

# Define Session model for auth tokens
class Session(Base):
    __tablename__ = "sessions"

    token = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

# Define PatientProfile model for profile handling
class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    weight_kg = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)
    age_years = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    activity_level = Column(String, nullable=False)
    bp_stage = Column(String, nullable=False)
    diet_pref = Column(String, nullable=False)


class AiDashRecipe(Base):
    __tablename__ = "ai_dash_recipes"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    meal_type = Column(String, nullable=False)
    diet_pref = Column(String, nullable=False)
    request_json = Column(JSON, nullable=False)
    result_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)

# Initialize database tables
def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
