from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import db
from app.routers import auth, tickets, media
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):

    db.connect()
    yield
 
    db.close()

app = FastAPI(title="Japanese Technical Support System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(media.router)

@app.get("/")
def read_root():
    return {"message": "Japanese Technical Support API (Whisper/Google/Mongo)"}
