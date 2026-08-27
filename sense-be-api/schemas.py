from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer

EndeavorStatus = Literal["planning", "active", "on_hold", "completed", "cancelled"]
EndeavorPriority = Literal["low", "medium", "high"]
EndeavorCategory = Literal[
    "personal", "business", "technology", "finance", "travel", "health", "legal", "other"
]


def _to_camel(field: str) -> str:
    head, *tail = field.split("_")
    return head + "".join(part.title() for part in tail)


class EndeavorInput(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    name: str
    summary: str
    description: str
    category: EndeavorCategory
    status: EndeavorStatus
    priority: EndeavorPriority
    keywords: list[str] = Field(default_factory=list)
    start_date: date | None = None
    target_date: date | None = None
    news_monitoring_enabled: bool = False


class Endeavor(EndeavorInput):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True, from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def _serialize_dt(self, dt: datetime, _info) -> str:
        return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"
