"""
Copilot Activity Controller
────────────────────────────
Read-only endpoints for Copilot transfer activity data.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.engine import Connection
from sqlalchemy import select

from commons.db.database import get_db
from inventory.models.copilot_activity import copilot_activity_table
from inventory.schemas import CopilotActivityResponse

router = APIRouter(prefix="/api/v1/copilot-activities", tags=["Copilot Activity"])


@router.get("", response_model=List[CopilotActivityResponse])
def list_copilot_activities(
    server_name: Optional[str] = Query(None, description="Filter by server name"),
    partner_id_ref: Optional[str] = Query(None, description="Filter by partner ID reference"),
    status: Optional[str] = Query(None, description="ACTIVE, ACTIVE_LOW, DORMANT"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    conn: Connection = Depends(get_db),
):
    """List Copilot activity records with optional filters."""
    query = select(copilot_activity_table)

    if server_name:
        query = query.where(copilot_activity_table.c.server_name == server_name)
    if partner_id_ref:
        query = query.where(copilot_activity_table.c.partner_id_ref == partner_id_ref)
    if status:
        query = query.where(copilot_activity_table.c.status_recommendation == status.upper())

    query = query.order_by(copilot_activity_table.c.id)
    query = query.offset((page - 1) * page_size).limit(page_size)

    rows = conn.execute(query).fetchall()
    return [dict(r._mapping) for r in rows]