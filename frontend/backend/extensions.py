from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# db = SQLAlchemy(model_class=Base)

engine_options = {"pool_pre_ping": True}

db = SQLAlchemy(model_class=Base, engine_options=engine_options)
