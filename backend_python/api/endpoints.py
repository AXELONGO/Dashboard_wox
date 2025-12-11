from fastapi import APIRouter, HTTPException, Request, Body
from typing import Optional, Dict, Any
from services.notion_service import NotionService
import os
import httpx
import logging

router = APIRouter()
notion_service = NotionService()

logger = logging.getLogger(__name__)

@router.get("/leads")
async def get_leads():
    try:
        return await notion_service.get_leads()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/leads")
async def create_lead(lead: Dict[str, Any] = Body(...)):
    try:
        return await notion_service.create_lead(lead)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(startDate: Optional[str] = None, endDate: Optional[str] = None):
    try:
        return await notion_service.get_history(startDate, endDate)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/history")
async def create_history_item(item: Dict[str, Any] = Body(...)):
    try:
        lead_id = item.get("leadId")
        text = item.get("text")
        agent = item.get("agent")
        interaction_type = item.get("interactionType")
        
        if not all([lead_id, text, agent, interaction_type]):
             raise HTTPException(status_code=400, detail="Missing fields")

        return await notion_service.create_history(lead_id, text, agent, interaction_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/pages/{page_id}")
async def update_page(page_id: str, body: Dict[str, Any] = Body(...)):
    try:
        properties = body.get("properties")
        archived = body.get("archived", False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CLIENTS ENDPOINTS ---

@router.get("/clients")
async def get_clients():
    try:
        return await notion_service.get_clients()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clients")
async def create_client(client: Dict[str, Any] = Body(...)):
    try:
        return await notion_service.create_client(client)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/support-tickets")
async def get_support_tickets():
    try:
        return await notion_service.get_support_tickets()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clients/history")
async def get_clients_history(startDate: Optional[str] = None, endDate: Optional[str] = None):
    try:
        return await notion_service.get_clients_history(startDate, endDate)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clients/history")
async def create_client_history_item(item: Dict[str, Any] = Body(...)):
    try:
        # Reusing similar payload structure as history
        client_id = item.get("clientId") # Changed from leadId to clientId for clarity, but logic is same ID
        text = item.get("text")
        agent = item.get("agent")
        interaction_type = item.get("interactionType")
        
        if not all([client_id, text, agent, interaction_type]):
             raise HTTPException(status_code=400, detail="Missing fields")

        return await notion_service.create_client_history(client_id, text, agent, interaction_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def webhook_proxy(request: Request):
    """
    Proxy for N8N Webhook to avoid CORS issues
    """
    body = await request.json()
    webhook_url = 'https://automatizaciones-n8n.tzudkj.easypanel.host/webhook/COTIZACION'
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=body)
            
        if response.status_code >= 200 and response.status_code < 300:
             return {"success": True}
        else:
             logger.error(f"N8N Error: {response.text}")
             raise HTTPException(status_code=response.status_code, detail="Webhook failed")

    except Exception as e:
        logger.error(f"Webhook Proxy Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
