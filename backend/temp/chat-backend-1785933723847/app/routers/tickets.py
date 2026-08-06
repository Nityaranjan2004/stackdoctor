from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Annotated
from app.models.ticket import Ticket, TicketCreate
from app.core.database import db
from app.services.websocket import manager
from app.routers.auth import get_current_user
from datetime import datetime

router = APIRouter()

@router.post("/tickets", response_model=Ticket)
async def create_ticket(ticket: TicketCreate):
    ticket_dict = ticket.dict()
    ticket_dict["created_at"] = datetime.utcnow()
    
    if db.tickets_collection is None:
        # Mock response if DB is not connected
        print("DB not connected, returning mock ticket")
        mock_ticket = ticket_dict.copy()
        mock_ticket["_id"] = "mock_id_123"
        await manager.broadcast("New Ticket Created!")
        return mock_ticket
    
    try:
        new_ticket = await db.tickets_collection.insert_one(ticket_dict)
        created_ticket = await db.tickets_collection.find_one({"_id": new_ticket.inserted_id})
        
        # Notify connected clients
        await manager.broadcast("New Ticket Created!")
        
        return created_ticket
    except Exception as e:
        print(f"DB Insert Error: {e}")
        raise HTTPException(status_code=500, detail="Database Insert Failed")

@router.get("/tickets", response_model=List[Ticket])
async def get_tickets(current_user: Annotated[dict, Depends(get_current_user)]):
    if db.tickets_collection is None:
        return []
        
    try:
        tickets = await db.tickets_collection.find().sort("created_at", -1).to_list(100)
        return tickets
    except Exception as e:
        print(f"DB Query Error: {e}")
        return []

@router.websocket("/ws/tickets")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
