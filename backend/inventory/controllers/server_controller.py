"""
Server Controller
─────────────────
CRUD operations for CFT server inventory.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.engine import Connection
from sqlalchemy import select

from commons.db.database import get_db
from inventory.models.server import server_table
from inventory.schemas import (
    ServerCreate,
    ServerUpdate,
    ServerResponse,
)

router = APIRouter(prefix="/api/v1/servers", tags=["Servers"])


# ── LIST ──────────────────────────────────────────────────────────────────────
@router.get("", response_model=List[ServerResponse])
def list_servers(
    environment: Optional[str] = Query(None, description="Filter by environment (PROD, DMZ, RECETTE)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    conn: Connection = Depends(get_db),
):
    """Return a paginated list of servers, optionally filtered by environment."""
    query = select(server_table)

    if environment:
        query = query.where(server_table.c.environment == environment.upper())

    query = query.order_by(server_table.c.name)
    query = query.offset((page - 1) * page_size).limit(page_size)

    rows = conn.execute(query).fetchall()
    return [dict(r._mapping) for r in rows]


# ── GET ───────────────────────────────────────────────────────────────────────
@router.get("/{server_id}", response_model=ServerResponse)
def get_server(
    server_id: int,
    conn: Connection = Depends(get_db),
):
    """Retrieve a single server by ID."""
    row = conn.execute(
        select(server_table).where(server_table.c.id == server_id)
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Server {server_id} not found")

    return dict(row._mapping)


# ── CREATE ────────────────────────────────────────────────────────────────────
@router.post("", response_model=ServerResponse, status_code=201)
def create_server(
    payload: ServerCreate,
    conn: Connection = Depends(get_db),
):
    """Create a new server record."""
    # Check for duplicate name
    existing = conn.execute(
        select(server_table).where(server_table.c.name == payload.name)
    ).fetchone()

    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Server with name '{payload.name}' already exists",
        )

    result = conn.execute(
        server_table.insert().values(**payload.model_dump())
    )
    server_id = result.inserted_primary_key[0]

    return dict(
        conn.execute(
            select(server_table).where(server_table.c.id == server_id)
        ).fetchone()._mapping
    )


# ── UPDATE ────────────────────────────────────────────────────────────────────
@router.patch("/{server_id}", response_model=ServerResponse)
def update_server(
    server_id: int,
    payload: ServerUpdate,
    conn: Connection = Depends(get_db),
):
    """Partially update a server record."""
    row = conn.execute(
        select(server_table).where(server_table.c.id == server_id)
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Server {server_id} not found")

    update_data = payload.model_dump(exclude_unset=True)
    if update_data:
        conn.execute(
            server_table.update()
            .where(server_table.c.id == server_id)
            .values(**update_data)
        )

    return dict(
        conn.execute(
            select(server_table).where(server_table.c.id == server_id)
        ).fetchone()._mapping
    )


# ── DELETE ────────────────────────────────────────────────────────────────────
@router.delete("/{server_id}", status_code=204)
def delete_server(
    server_id: int,
    conn: Connection = Depends(get_db),
):
    """Delete a server and all dependent records (cascade must be configured in models)."""
    row = conn.execute(
        select(server_table).where(server_table.c.id == server_id)
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Server {server_id} not found")

    conn.execute(server_table.delete().where(server_table.c.id == server_id))
    return None