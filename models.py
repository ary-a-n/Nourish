from sqlalchemy import Column, Integer, Float, Boolean, String, Date
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    age = Column(Integer)
    weight = Column(Float)
    height = Column(Float)
    smoking = Column(Boolean)
    alcohol = Column(Boolean)


class DailyHealth(Base):
    __tablename__ = "daily_health"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    date = Column(Date)

    systolic_bp = Column(Integer)
    diastolic_bp = Column(Integer)

    bmi = Column(Float)
    bp_category = Column(String)