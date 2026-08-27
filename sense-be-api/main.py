from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import Base, engine, get_session
from repositories import EndeavorRepository, NotFoundError, SqlEndeavorRepository
from schemas import Endeavor, EndeavorInput


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_repository(session: AsyncSession = Depends(get_session)) -> EndeavorRepository:
    return SqlEndeavorRepository(session)


@app.get("/endeavors", response_model=list[Endeavor])
async def list_endeavors(repo: EndeavorRepository = Depends(get_repository)):
    return await repo.list()


@app.get("/endeavors/{id}", response_model=Endeavor)
async def get_endeavor(id: str, repo: EndeavorRepository = Depends(get_repository)):
    endeavor = await repo.get(id)
    if endeavor is None:
        raise HTTPException(status_code=404, detail="Endeavor not found")
    return endeavor


@app.post("/endeavors", response_model=Endeavor, status_code=201)
async def create_endeavor(input: EndeavorInput, repo: EndeavorRepository = Depends(get_repository)):
    return await repo.create(input)


@app.put("/endeavors/{id}", response_model=Endeavor)
async def update_endeavor(
    id: str, input: EndeavorInput, repo: EndeavorRepository = Depends(get_repository)
):
    try:
        return await repo.update(id, input)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Endeavor not found")


@app.delete("/endeavors/{id}", status_code=204)
async def delete_endeavor(id: str, repo: EndeavorRepository = Depends(get_repository)):
    try:
        await repo.delete(id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Endeavor not found")
