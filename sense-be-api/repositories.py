from abc import ABC, abstractmethod

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import EndeavorRecord
from schemas import Endeavor, EndeavorInput


class NotFoundError(Exception):
    pass


class EndeavorRepository(ABC):
    @abstractmethod
    async def list(self) -> list[Endeavor]: ...

    @abstractmethod
    async def get(self, id: str) -> Endeavor | None: ...

    @abstractmethod
    async def create(self, input: EndeavorInput) -> Endeavor: ...

    @abstractmethod
    async def update(self, id: str, input: EndeavorInput) -> Endeavor: ...

    @abstractmethod
    async def delete(self, id: str) -> None: ...


class SqlEndeavorRepository(EndeavorRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self) -> list[Endeavor]:
        result = await self.session.execute(
            select(EndeavorRecord).order_by(EndeavorRecord.updated_at.desc())
        )
        return [Endeavor.model_validate(record) for record in result.scalars().all()]

    async def get(self, id: str) -> Endeavor | None:
        record = await self.session.get(EndeavorRecord, id)
        return Endeavor.model_validate(record) if record else None

    async def create(self, input: EndeavorInput) -> Endeavor:
        record = EndeavorRecord(**input.model_dump())
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return Endeavor.model_validate(record)

    async def update(self, id: str, input: EndeavorInput) -> Endeavor:
        record = await self.session.get(EndeavorRecord, id)
        if record is None:
            raise NotFoundError(id)
        for key, value in input.model_dump().items():
            setattr(record, key, value)
        await self.session.commit()
        await self.session.refresh(record)
        return Endeavor.model_validate(record)

    async def delete(self, id: str) -> None:
        record = await self.session.get(EndeavorRecord, id)
        if record is None:
            raise NotFoundError(id)
        await self.session.delete(record)
        await self.session.commit()
