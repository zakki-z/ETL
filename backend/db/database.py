import os
from sqlalchemy import create_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://localhost:5432/stroom_db",
)

engine = create_engine(DATABASE_URL, echo=False)


def get_db():
    """
    Yield a raw connection (not an ORM Session).
    Controllers use Core-style queries (select, insert, update),
    so we give them a Connection inside a transaction that auto-commits.
    """
    with engine.connect() as conn:
        # Start a transaction; commit on success, rollback on error
        with conn.begin():
            yield conn
