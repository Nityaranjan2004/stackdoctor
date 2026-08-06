from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    tickets_collection = None

    def connect(self):
        if settings.MONGO_URI and "<cluster>" not in settings.MONGO_URI:
            try:
                self.client = AsyncIOMotorClient(settings.MONGO_URI)
                db = self.client.support_system
                self.tickets_collection = db.tickets
                print("Connected to MongoDB Atlas")
            except Exception as e:
                print(f"Failed to connect to MongoDB: {e}")
        else:
            print("WARNING: MONGO_URI not set or contains placeholders. Database features will be disabled.")

    def close(self):
        if self.client:
            self.client.close()

db = Database()
