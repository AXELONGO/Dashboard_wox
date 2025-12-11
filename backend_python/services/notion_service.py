import os
from notion_client import Client
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class NotionService:
    def __init__(self):
        self.notion = Client(auth=os.getenv("NOTION_API_KEY"))
        self.leads_db_id = os.getenv("NOTION_DATABASE_ID")
        self.history_db_id = os.getenv("NOTION_HISTORY_DB_ID")
        self.clients_db_id = os.getenv("NOTION_CLIENTS_DB_ID")
        self.clients_history_db_id = os.getenv("NOTION_CLIENTS_HISTORY_DB_ID")


    async def get_leads(self) -> List[Dict[str, Any]]:
        if not self.leads_db_id:
            logger.error("NOTION_DATABASE_ID not set")
            raise ValueError("NOTION_DATABASE_ID not set")

        all_results = []
        has_more = True
        next_cursor = None

        while has_more:
            try:
                response = self.notion.databases.query(
                    database_id=self.leads_db_id,
                    page_size=100,
                    start_cursor=next_cursor
                )
                all_results.extend(response.get("results", []))
                has_more = response.get("has_more")
                next_cursor = response.get("next_cursor")
            except Exception as e:
                logger.error(f"Error fetching leads from Notion: {e}")
                raise e

        from .data_processing import process_leads
        return process_leads(all_results)

    async def get_history(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self.history_db_id:
             raise ValueError("NOTION_HISTORY_DB_ID not set")
        
        filters = []
        if start_date:
            filters.append({"timestamp": "created_time", "created_time": {"on_or_after": start_date}})
        if end_date:
            filters.append({"timestamp": "created_time", "created_time": {"on_or_before": end_date}})
        
        query = {
            "database_id": self.history_db_id,
            "sorts": [{"timestamp": "created_time", "direction": "descending"}],
            "page_size": 100
        }

        if filters:
            if len(filters) == 1:
                query["filter"] = filters[0]
            else:
                query["filter"] = {"and": filters}

        try:
            response = self.notion.databases.query(**query)
            from .data_processing import process_history
            return process_history(response.get("results", []))
        except Exception as e:
            logger.error(f"Error fetching history: {e}")
            raise e


    async def create_lead(self, lead: Dict[str, Any]) -> Dict[str, Any]:
        if not self.leads_db_id:
             raise ValueError("NOTION_DATABASE_ID not set")

        properties = {
            "Name": {"title": [{"text": {"content": lead.get("name", "")}}]},
            "Dirección": {"rich_text": [{"text": {"content": lead.get("address", "")}}]},
            "Teléfono": {"phone_number": lead.get("phone") or None},
            "Website": {"url": lead.get("website") or None},
            "Clase": {"select": {"name": lead.get("clase", "C")}},
            "Responsable": {"select": {"name": lead.get("agent", "Sin Asignar")}}
        }

        try:
            return self.notion.pages.create(
                parent={"database_id": self.leads_db_id},
                properties=properties
            )
        except Exception as e:
            logger.error(f"Error creating lead: {e}")
            raise e

    async def create_history(self, lead_id: str, text: str, agent: str, interaction_type: str) -> Dict[str, Any]:
        if not self.history_db_id:
             raise ValueError("NOTION_HISTORY_DB_ID not set")
        
        # We need to fetch DB schema to match columns logic from Node.js
        db = self.notion.databases.retrieve(database_id=self.history_db_id)
        props = db.get("properties", {})
        keys = list(props.keys())
        import re
        
        def find_key_loose(regex, default):
            for k in keys:
                if re.search(regex, k, re.IGNORECASE):
                    return k
            return default

        title_key = find_key_loose(r'asesor', 'Asesor') # Usually title type
        # In Node.js: keys.find(k => props[k].type === 'title') || 'Asesor';
        # We should strictly find title type first
        title_key = next((k for k in keys if props[k]['type'] == 'title'), 'Asesor')

        relation_key = next((k for k in keys if props[k]['type'] == 'relation'), 'Cliente')
        contact_key = find_key_loose(r'contacto|prospeccion', 'Contacto')
        comment_key = find_key_loose(r'comentario|detalle|descri', 'Comentario')
        date_key = find_key_loose(r'fecha|date', 'Fecha')

        new_props = {}
        new_props[title_key] = {"title": [{"text": {"content": agent}}]}
        
        rel_prop_conf = props.get(relation_key, {})
        if rel_prop_conf.get("type") == "relation":
            new_props[relation_key] = {"relation": [{"id": lead_id}]}
        elif rel_prop_conf.get("type") in ["rich_text", "title"]:
             # Fallback logic: Try to fetch lead name to store as text
             try:
                 lead_page = self.notion.pages.retrieve(page_id=lead_id)
                 lp = lead_page.get("properties", {})
                 lt_key = next((k for k in lp if lp[k]['type'] == 'title'), None)
                 lead_name = "Cliente Desconocido"
                 if lt_key and lp[lt_key].get("title"):
                     lead_name = lp[lt_key]["title"][0].get("plain_text", "Cliente Desconocido")
                 
                 new_props[relation_key] = {"rich_text": [{"text": {"content": lead_name}}]}
             except Exception:
                  new_props[relation_key] = {"rich_text": [{"text": {"content": f"ID: {lead_id}"}}]}

        new_props[contact_key] = {"rich_text": [{"text": {"content": interaction_type}}]}
        new_props[comment_key] = {"rich_text": [{"text": {"content": text}}]}
        
        if date_key in props:
             from datetime import datetime
             new_props[date_key] = {"date": {"start": datetime.utcnow().isoformat()}}

        return self.notion.pages.create(
            parent={"database_id": self.history_db_id},
            properties=new_props
        )

    async def update_page(self, page_id: str, properties: Dict[str, Any], archived: bool = False) -> Dict[str, Any]:
        return self.notion.pages.update(
            page_id=page_id,
            properties=properties,
            archived=archived
        )

    # --- CLIENTS METHODS ---

    async def get_clients(self) -> List[Dict[str, Any]]:
        if not self.clients_db_id:
            logger.error("NOTION_CLIENTS_DB_ID not set")
            raise ValueError("NOTION_CLIENTS_DB_ID not set")

        all_results = []
        has_more = True
        next_cursor = None

        while has_more:
            try:
                response = self.notion.databases.query(
                    database_id=self.clients_db_id,
                    page_size=100,
                    start_cursor=next_cursor
                )
                all_results.extend(response.get("results", []))
                has_more = response.get("has_more")
                next_cursor = response.get("next_cursor")
            except Exception as e:
                logger.error(f"Error fetching clients from Notion: {e}")
                raise e

        # Reuse process_leads logic as structure is supposedly same
        from .data_processing import process_leads
        return process_leads(all_results)

    async def get_clients_history(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self.clients_history_db_id:
             raise ValueError("NOTION_CLIENTS_HISTORY_DB_ID not set")
        
        filters = []
        if start_date:
            filters.append({"timestamp": "created_time", "created_time": {"on_or_after": start_date}})
        if end_date:
            filters.append({"timestamp": "created_time", "created_time": {"on_or_before": end_date}})
        
        query = {
            "database_id": self.clients_history_db_id,
            "sorts": [{"timestamp": "created_time", "direction": "descending"}],
            "page_size": 100
        }

        if filters:
            if len(filters) == 1:
                query["filter"] = filters[0]
            else:
                query["filter"] = {"and": filters}

        try:
            response = self.notion.databases.query(**query)
            from .data_processing import process_history
            return process_history(response.get("results", []))
        except Exception as e:
            logger.error(f"Error fetching clients history: {e}")
            raise e

    async def create_client(self, client: Dict[str, Any]) -> Dict[str, Any]:
        if not self.clients_db_id:
             raise ValueError("NOTION_CLIENTS_DB_ID not set")
        
        # Reuse logic from create_lead but pointing to clients DB
        properties = {
            "Name": {"title": [{"text": {"content": client.get("name", "")}}]},
            "Dirección": {"rich_text": [{"text": {"content": client.get("address", "")}}]},
            "Teléfono": {"phone_number": client.get("phone") or None},
            "Website": {"url": client.get("website") or None},
            "Clase": {"select": {"name": client.get("clase", "C")}},
            "Responsable": {"select": {"name": client.get("agent", "Sin Asignar")}}
        }

        try:
            return self.notion.pages.create(
                parent={"database_id": self.clients_db_id},
                properties=properties
            )
        except Exception as e:
            logger.error(f"Error creating client: {e}")
            raise e

    async def create_client_history(self, client_id: str, text: str, agent: str, interaction_type: str) -> Dict[str, Any]:
        if not self.clients_history_db_id:
             raise ValueError("NOTION_CLIENTS_HISTORY_DB_ID not set")
        
        # Reuse logic from create_history but pointing to clients history DB
        db = self.notion.databases.retrieve(database_id=self.clients_history_db_id)
        props = db.get("properties", {})
        keys = list(props.keys())
        import re
        
        def find_key_loose(regex, default):
            for k in keys:
                if re.search(regex, k, re.IGNORECASE):
                    return k
            return default

        title_key = next((k for k in keys if props[k]['type'] == 'title'), 'Asesor')
        relation_key = next((k for k in keys if props[k]['type'] == 'relation'), 'Cliente')
        contact_key = find_key_loose(r'contacto|prospeccion', 'Contacto')
        comment_key = find_key_loose(r'comentario|detalle|descri', 'Comentario')
        date_key = find_key_loose(r'fecha|date', 'Fecha')

        new_props = {}
        new_props[title_key] = {"title": [{"text": {"content": agent}}]}
        
        rel_prop_conf = props.get(relation_key, {})
        if rel_prop_conf.get("type") == "relation":
            new_props[relation_key] = {"relation": [{"id": client_id}]}
        elif rel_prop_conf.get("type") in ["rich_text", "title"]:
             # Fallback
             try:
                 client_page = self.notion.pages.retrieve(page_id=client_id)
                 lp = client_page.get("properties", {})
                 lt_key = next((k for k in lp if lp[k]['type'] == 'title'), None)
                 client_name = "Cliente Desconocido"
                 if lt_key and lp[lt_key].get("title"):
                     client_name = lp[lt_key]["title"][0].get("plain_text", "Cliente Desconocido")
                 
                 new_props[relation_key] = {"rich_text": [{"text": {"content": client_name}}]}
             except Exception:
                  new_props[relation_key] = {"rich_text": [{"text": {"content": f"ID: {client_id}"}}]}

        new_props[contact_key] = {"rich_text": [{"text": {"content": interaction_type}}]}
        new_props[comment_key] = {"rich_text": [{"text": {"content": text}}]}
        
        if date_key in props:
             from datetime import datetime
             new_props[date_key] = {"date": {"start": datetime.utcnow().isoformat()}}

        return self.notion.pages.create(
            parent={"database_id": self.clients_history_db_id},
            properties=new_props
        )
