import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
    MONGO_URI = os.getenv("MONGO_URI")
    SECRET_KEY = "super-secret-key-change-this-in-production"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

settings = Settings()
