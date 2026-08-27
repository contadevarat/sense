import asyncio
import uuid
from abc import ABC, abstractmethod

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import s3_storage
from models import EndeavorFileRecord, EndeavorRecord
from schemas import (
    ALLOWED_FILE_CONTENT_TYPES,
    MAX_FILE_SIZE_BYTES,
    Endeavor,
    EndeavorFile,
    EndeavorFileInput,
    EndeavorFileUploadResult,
    EndeavorInput,
)


class NotFoundError(Exception):
    pass


class InvalidFileError(Exception):
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
        files = await self.session.execute(
            select(EndeavorFileRecord).where(EndeavorFileRecord.endeavor_id == id)
        )
        for file_record in files.scalars().all():
            await asyncio.to_thread(s3_storage.delete_object, file_record.s3_key)
        await self.session.delete(record)
        await self.session.commit()


class EndeavorFileRepository(ABC):
    @abstractmethod
    async def list(self, endeavor_id: str) -> list[EndeavorFile]: ...

    @abstractmethod
    async def create(self, endeavor_id: str, input: EndeavorFileInput) -> EndeavorFileUploadResult: ...

    @abstractmethod
    async def delete(self, endeavor_id: str, file_id: str) -> None: ...


class SqlEndeavorFileRepository(EndeavorFileRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self, endeavor_id: str) -> list[EndeavorFile]:
        if await self.session.get(EndeavorRecord, endeavor_id) is None:
            raise NotFoundError(endeavor_id)
        result = await self.session.execute(
            select(EndeavorFileRecord)
            .where(EndeavorFileRecord.endeavor_id == endeavor_id)
            .order_by(EndeavorFileRecord.uploaded_at.desc())
        )
        return [self._to_schema(record) for record in result.scalars().all()]

    async def create(self, endeavor_id: str, input: EndeavorFileInput) -> EndeavorFileUploadResult:
        if await self.session.get(EndeavorRecord, endeavor_id) is None:
            raise NotFoundError(endeavor_id)
        if input.content_type not in ALLOWED_FILE_CONTENT_TYPES:
            raise InvalidFileError(f'Unsupported file type "{input.content_type}"')
        if input.size_bytes > MAX_FILE_SIZE_BYTES:
            raise InvalidFileError(f"File exceeds the {MAX_FILE_SIZE_BYTES} byte limit")

        file_id = str(uuid.uuid4())
        key = s3_storage.build_key(endeavor_id, file_id, input.name)
        # Sign the upload URL before writing anything - if this fails (bad
        # credentials, misconfigured bucket, ...) no orphaned row is left behind.
        upload_url = s3_storage.presigned_upload_url(key, input.content_type)

        record = EndeavorFileRecord(
            id=file_id,
            endeavor_id=endeavor_id,
            name=input.name,
            content_type=input.content_type,
            size_bytes=input.size_bytes,
            s3_key=key,
        )
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)

        return EndeavorFileUploadResult(file=self._to_schema(record), upload_url=upload_url)

    async def delete(self, endeavor_id: str, file_id: str) -> None:
        record = await self.session.get(EndeavorFileRecord, file_id)
        if record is None or record.endeavor_id != endeavor_id:
            raise NotFoundError(file_id)
        await asyncio.to_thread(s3_storage.delete_object, record.s3_key)
        await self.session.delete(record)
        await self.session.commit()

    def _to_schema(self, record: EndeavorFileRecord) -> EndeavorFile:
        return EndeavorFile(
            id=record.id,
            endeavor_id=record.endeavor_id,
            name=record.name,
            content_type=record.content_type,
            size_bytes=record.size_bytes,
            uploaded_at=record.uploaded_at,
            download_url=s3_storage.presigned_download_url(record.s3_key),
        )
