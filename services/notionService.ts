import { Lead, HistoryItem } from "../types";

// --- CONFIGURACIÓN ---
// Ya no necesitamos las claves de API aquí, el backend se encarga.
// Solo apuntamos a la ruta relativa /api que Nginx redirigirá.
const API_BASE_URL = "/api";

// --- LEADS ---

export const getLeadsFromNotion = async (): Promise<Lead[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/leads`);

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ Error Backend Leads: ${response.status}`, errText);
            throw new Error(errText);
        }

        const leads = await response.json();
        return leads;

    } catch (error) {
        console.error("Error crítico obteniendo leads del backend:", error);
        return [];
    }
};

export const updateLeadClass = async (leadId: string, newClass: string, notionData?: any): Promise<boolean> => {
    const url = `${API_BASE_URL}/pages/${leadId}`;
    const propName = notionData?.claseColName || 'Clase';
    const propType = notionData?.claseColType || 'select';

    const properties: any = {};
    if (propType === 'rich_text') {
        properties[propName] = { rich_text: [{ text: { content: newClass } }] };
    } else {
        properties[propName] = { select: { name: newClass } };
    }

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ properties })
        });
        return response.ok;
    } catch (e) { return false; }
}

export const syncLeadToNotion = async (lead: Lead): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lead)
        });

        if (!response.ok) {
            console.error("❌ Error Sync Lead:", await response.text());
            return false;
        }

        const data = await response.json();
        lead.id = data.id;
        return true;
    } catch (error) {
        console.error("❌ Error de red Sync Lead:", error);
        return false;
    }
};

// --- HISTORIAL ---

export const getHistoryFromNotionDatabase = async (leadId?: string, startDate?: string, endDate?: string): Promise<HistoryItem[]> => {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${API_BASE_URL}/history?${params.toString()}`);

        if (!response.ok) throw new Error(await response.text());

        let items = await response.json();

        if (leadId) {
            items = items.filter((i: HistoryItem) => i.clientId === leadId);
        }

        return items;

    } catch (e) {
        console.error("❌ Error leyendo historial del backend:", e);
        return [];
    }
};

export const addHistoryToNotionDatabase = async (leadId: string, text: string, agent: string, interactionType: string): Promise<HistoryItem | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, text, agent, interactionType })
        });

        if (!response.ok) {
            console.error("❌ Error adding history:", await response.text());
            return null;
        }

        const data = await response.json();

        return {
            id: data.id,
            type: interactionType.toLowerCase().includes('mail') || interactionType.toLowerCase().includes('what') ? 'email' : 'note',
            title: interactionType,
            description: text,
            timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            isoDate: new Date().toISOString(),
            user: { name: agent, avatarUrl: '' },
            clientId: leadId,
            isSynced: true
        };

    } catch (error) {
        console.error("❌ Error de red al conectar con Notion:", error);
        return null;
    }
};

export const deletePage = async (pageId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archived: true })
        });
        return response.ok;
    } catch (error) {
        console.error("Error deleting page:", error);
        return false;
    }
};

export const updatePage = async (pageId: string, properties: any): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/pages/${pageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ properties })
        });
        return response.ok;
    } catch (error) {
        console.error("Error updating page:", error);
        return false;
    }
}

// --- CLIENTES METHODS ---

export const getClientsFromNotion = async (): Promise<Lead[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/clients`);

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ Error Backend Clients: ${response.status}`, errText);
            throw new Error(errText);
        }

        const clients = await response.json();
        return clients;

    } catch (error) {
        console.error("Error crítico obteniendo clientes del backend:", error);
        return [];
    }
};

export const syncClientToNotion = async (client: Lead): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });

        if (!response.ok) {
            console.error("❌ Error Sync Client:", await response.text());
            return false;
        }

        const data = await response.json();
        client.id = data.id;
        return true;
    } catch (error) {
        console.error("❌ Error de red Sync Client:", error);
        return false;
    }
};

export const getClientsHistoryFromNotionDatabase = async (clientId?: string, startDate?: string, endDate?: string): Promise<HistoryItem[]> => {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${API_BASE_URL}/clients/history?${params.toString()}`);

        if (!response.ok) throw new Error(await response.text());

        let items = await response.json();

        if (clientId) {
            items = items.filter((i: HistoryItem) => i.clientId === clientId);
        }

        return items;

    } catch (e) {
        console.error("❌ Error leyendo historial de clientes del backend:", e);
        return [];
    }
};

export const createClientInNotion = async (clientData: Partial<Lead>): Promise<Lead | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });

        if (!response.ok) {
            throw new Error(`Error creating client: ${response.statusText}`);
        }

        const newClient = await response.json();
        return newClient;
    } catch (error) {
        console.error("Error creating client in Notion:", error);
        return null;
    }
};

export const addClientHistoryToNotionDatabase = async (clientId: string, text: string, agent: string, interactionType: string): Promise<HistoryItem | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/clients/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, text, agent, interactionType })
        });

        if (!response.ok) {
            console.error("❌ Error adding client history:", await response.text());
            return null;
        }

        const data = await response.json();

        return {
            id: data.id,
            type: interactionType.toLowerCase().includes('mail') || interactionType.toLowerCase().includes('what') ? 'email' : 'note',
            title: interactionType,
            description: text,
            timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            isoDate: new Date().toISOString(),
            user: { name: agent, avatarUrl: '' },
            clientId: clientId,
            isSynced: true
        };

    } catch (error) {
        console.error("❌ Error de red al conectar con Notion (Clientes):", error);
        return null;
    }
};

export const getSupportTicketsFromNotion = async (): Promise<any[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/support-tickets`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tickets = await response.json();
        return tickets;
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        return [];
    }
};
