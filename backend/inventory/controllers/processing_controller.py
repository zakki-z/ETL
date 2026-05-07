"""
Processing Controller
─────────────────────
Read-only endpoints for exit-script processing records.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.engine import Connection
from sqlalchemy import select

from commons.db.database import get_db
from inventory.models.processing import processing_table
from inventory.schemas import ProcessingResponse

router = APIRouter(prefix="/api/v1", tags=["Processing (Exit Scripts)"])


# ── LIST by server ────────────────────────────────────────────────────────────
@router.get(
    "/servers/{server_id}/processing",
    response_model=List[ProcessingResponse],
)
def list_processing_by_server(
    server_id: int,
    bucket: Optional[str] = Query(None, description="A, B, or C"),
    script_type: Optional[str] = Query(None, description="EXITEOT, EXITBOT, EXITDIR, EXITFILE"),
    has_unknown_calls: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    conn: Connection = Depends(get_db),
):
    """List exit-script processing records for a server."""
    query = select(processing_table).where(processing_table.c.server_id == server_id)

    if bucket:
        query = query.where(processing_table.c.bucket == bucket.upper())
    if script_type:
        query = query.where(processing_table.c.script_type == script_type.upper())
    if has_unknown_calls is not None:
        query = query.where(processing_table.c.calls_unknown_scripts == has_unknown_calls)

    query = query.order_by(processing_table.c.id)
    query = query.offset((page - 1) * page_size).limit(page_size)

    rows = conn.execute(query).fetchall()
    return [dict(r._mapping) for r in rows]


# ── LIST by flow ──────────────────────────────────────────────────────────────
@router.get(
    "/flows/{flow_id}/processing",
    response_model=List[ProcessingResponse],
)
def list_processing_by_flow(
    flow_id: int,
    conn: Connection = Depends(get_db),
):
    """List exit-script records linked to a specific flow."""
    rows = conn.execute(
        select(processing_table)
        .where(processing_table.c.flow_id == flow_id)
        .order_by(processing_table.c.id)
    ).fetchall()
    return [dict(r._mapping) for r in rows]


# ── GET ───────────────────────────────────────────────────────────────────────
@router.get("/processing/{processing_id}", response_model=ProcessingResponse)
def get_processing(
    processing_id: int,
    conn: Connection = Depends(get_db),
):
    """Retrieve a single processing record."""
    row = conn.execute(
        select(processing_table).where(processing_table.c.id == processing_id)
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail=f"Processing {processing_id} not found")

    return dict(row._mapping)