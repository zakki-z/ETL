"""
Single shared MetaData instance for the entire application.
Every model file imports `metadata` from here.
"""
from sqlalchemy import MetaData

metadata = MetaData()
