"""Client registry CRUD routes. See architecture-design.md §9, scope §7."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import Client, User
from app.schemas.client import ClientCreate, ClientResponse, ClientUpdate

router = APIRouter(prefix="/clients", tags=["clients"])


async def _get_client_or_404(db: AsyncSession, client_id: uuid.UUID) -> Client:
    client = await db.get(Client, client_id)
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "client not found")
    return client


@router.get("", response_model=list[ClientResponse])
async def list_clients(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[User, Depends(get_current_user)],
) -> list[Client]:
    result = await db.execute(select(Client).order_by(Client.name))
    return list(result.scalars().all())


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Client:
    client = Client(**payload.model_dump(), created_by=user.id)
    db.add(client)
    await db.flush()
    return client


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Client:
    return await _get_client_or_404(db, client_id)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: uuid.UUID,
    payload: ClientUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Client:
    client = await _get_client_or_404(db, client_id)
    for field, value in payload.model_dump().items():
        setattr(client, field, value)
    await db.flush()
    await db.refresh(client)  # reload the server-side updated_at
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[User, Depends(get_current_user)],
) -> None:
    client = await _get_client_or_404(db, client_id)
    await db.delete(client)
    try:
        await db.flush()
    except IntegrityError as exc:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "client has generations and cannot be deleted",
        ) from exc
