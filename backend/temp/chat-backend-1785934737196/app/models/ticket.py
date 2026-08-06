from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import Optional, Annotated
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class TicketCreate(BaseModel):
    original_text: str
    translated_text: str
    category: str
    assigned_to: str
    status: str = "Open"

class Ticket(TicketCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class Token(BaseModel):
    access_token: str
    token_type: str
