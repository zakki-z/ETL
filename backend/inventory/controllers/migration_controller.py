"""
Migration Controller
────────────────────
CRUD for migration tracking records.
Supports status transitions and complexity-based filtering.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.engine import Connection
from sqlalchemy import select, text

from commons.db.database import get_db
from inventory.models.migration import migration_table
from inventory.schemas import MigrationResponse, MigrationUpdate

router = APIRouter(prefix="/api/v1/migrations", tags=["Migrations"])

VALID_STATUSES = {"pending", "in_progress", "testing", "completed", "blocked"}
VALID_COMPLEXITIES = {"low", "medium", "high"}


# ── LIST ──────────────────────────────────────────────────────────────────────
@router.get("", response_model=List[MigrationResponse])
def list_migrations(
    status: Optional[str] = Query(None, description="pending, in_progress, testing, completed, blocked"),
    complexity: Optional[str] = Query(None, description="low, medium, high"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    conn: Connection = Depends(get_db),
):
    """List migration records with optional filters."""
    query = select(migration_table)

    if status:
        query = query.where(migration_table.c.status == status.lower())
    if complexity:
        query = query.where(migration_table.c.complexity == complexity.lower())

    query = query.order_by(migration_table.c.last_updated.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    rows = conn.execute(query).fetchall()
    return [dict(r._mapping) for r in rows]


# ── GET ───────────────────────────────────────────────────────────────────────
@router.get("/{migration_id}", response_model=MigrationResponse)
def get_migration(
    migration_id: int,
    conn: Connection = Depends(get_db),
):
    """Retrieve a single migration record."""
    row = conn.execute(
        select(migration_table).where(migration_table.c.id == migration_id)
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Migration {migration_id} not found")

    return dict(row._mapping)


# ── UPDATE ────────────────────────────────────────────────────────────────────
@router.patch("/{migration_id}", response_model=MigrationResponse)
def update_migration(
    migration_id: int,
    payload: MigrationUpdate,
    conn: Connection = Depends(get_db),
):
    """Update migration status, complexity, or notes."""
    row = conn.execute(
        select(migration_table).where(migration_table.c.id == migration_id)
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Migration {migration_id} not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}",
        )
    if "complexity" in update_data and update_data["complexity"] not in VALID_COMPLEXITIES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid complexity. Must be one of: {', '.join(sorted(VALID_COMPLEXITIES))}",
        )

    update_data["last_updated"] = datetime.utcnow()

    conn.execute(
        migration_table.update()
        .where(migration_table.c.id == migration_id)
        .values(**update_data)
    )

    return dict(
        conn.execute(
            select(migration_table).where(migration_table.c.id == migration_id)
        ).fetchone()._mapping
    )


# ── SUMMARY ──────────────────────────────────────────────────────────────────
@router.get("/stats/summary")
def migration_summary(conn: Connection = Depends(get_db)):
    """
    Return an aggregate summary of migration progress:
    counts by status and by complexity.
    """
    by_status = conn.execute(
        text("SELECT status, COUNT(*) as count FROM migration GROUP BY status")
    ).fetchall()

    by_complexity = conn.execute(
        text("SELECT complexity, COUNT(*) as count FROM migration GROUP BY complexity")
    ).fetchall()

    total = conn.execute(text("SELECT COUNT(*) FROM migration")).scalar()

    return {
        "total": total,
        "by_status": {row[0]: row[1] for row in by_status},
        "by_complexity": {row[0]: row[1] for row in by_complexity},
    }