const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Google Auth
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const allowedUsers = require('./allowed_users.json');

// Routes

// POST /api/auth/google
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        if (allowedUsers.includes(email)) {
            res.json({ success: true, user: { email, name: payload.name, picture: payload.picture } });
        } else {
            res.status(403).json({ error: 'Access Denied', message: 'Email not in allowed list.' });
        }
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({ error: 'Invalid Token' });
    }
});

// GET /api/leads
app.get('/api/leads', async (req, res) => {
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!databaseId) {
        return res.status(500).json({ error: 'Missing NOTION_DATABASE_ID' });
    }

    try {
        let allResults = [];
        let hasMore = true;
        let nextCursor = undefined;

        while (hasMore) {
            const response = await notion.databases.query({
                database_id: databaseId,
                page_size: 100,
                start_cursor: nextCursor,
            });

            allResults = [...allResults, ...response.results];
            hasMore = response.has_more;
            nextCursor = response.next_cursor;
        }

        const cleanLeads = allResults.map(page => {
            const props = page.properties;
            const keys = Object.keys(props);

            const titleKey = keys.find(key => props[key].type === 'title') || 'Name';
            const name = props[titleKey]?.title?.[0]?.plain_text || 'Sin Nombre';

            const addressKey = keys.find(k => /address|direcci|ubicaci/i.test(k));
            const address = addressKey && props[addressKey]?.rich_text?.[0]?.plain_text || 'Dirección no especificada';

            const phoneKey = keys.find(k => /phone|tel/i.test(k));
            const phone = props[phoneKey]?.phone_number || props[phoneKey]?.rich_text?.[0]?.plain_text || '';

            const webKey = keys.find(k => /web|url/i.test(k));
            const website = props[webKey]?.url || '';

            const classKey = keys.find(k => /clase|class/i.test(k));
            let clase = 'C';
            if (classKey) {
                const cProp = props[classKey];
                if (cProp.type === 'select') clase = cProp.select?.name || 'C';
                else if (cProp.type === 'rich_text') clase = cProp.rich_text?.[0]?.plain_text || 'C';
            }

            const agentKey = keys.find(k => /responsable|agent/i.test(k));
            const agent = props[agentKey]?.select?.name || 'Sin Asignar';

            const notionData = {
                claseColName: classKey || 'Clase',
                claseColType: props[classKey]?.type || 'select'
            };

            return {
                id: page.id,
                name,
                address,
                phone,
                website,
                category: 'Otros',
                clase,
                agent,
                isSelected: false,
                isSynced: true,
                notionData
            };
        });

        res.json(cleanLeads);

    } catch (error) {
        console.error("Error fetching leads:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/history
app.get('/api/history', async (req, res) => {
    const databaseId = process.env.NOTION_HISTORY_DB_ID;

    if (!databaseId) {
        return res.status(500).json({ error: 'Missing NOTION_HISTORY_DB_ID' });
    }

    try {
        const { startDate, endDate } = req.query;
        const filters = [];

        if (startDate) {
            filters.push({
                timestamp: 'created_time',
                created_time: {
                    on_or_after: startDate
                }
            });
        }

        if (endDate) {
            filters.push({
                timestamp: 'created_time',
                created_time: {
                    on_or_before: endDate
                }
            });
        }

        const query = {
            database_id: databaseId,
            sorts: [{ timestamp: 'created_time', direction: 'descending' }],
            page_size: 100
        };

        if (filters.length > 0) {
            if (filters.length === 1) {
                query.filter = filters[0];
            } else {
                query.filter = {
                    and: filters
                };
            }
        }

        const response = await notion.databases.query(query);

        const cleanHistory = response.results.map(page => {
            const props = page.properties;
            const keys = Object.keys(props);

            // DEBUG: Print keys for the first item to help identify the relation column
            if (response.results.indexOf(page) === 0) {
                console.log("DEBUG: History Item Keys:", keys);
                console.log("DEBUG: History Item Props (partial):", JSON.stringify(props, null, 2));
            }

            const titleKey = keys.find(k => props[k].type === 'title') || 'Asesor';
            const agentName = props[titleKey]?.title?.[0]?.plain_text || 'Sistema';

            const typeKey = keys.find(k => /contacto|prospeccion/i.test(k)) || 'Contacto';
            const typeProp = props[typeKey];
            let title = 'Nota';
            if (typeProp?.rich_text?.length > 0) title = typeProp.rich_text[0].plain_text;
            else if (typeProp?.select) title = typeProp.select.name;

            const descKey = keys.find(k => /comentario|detalle|descri/i.test(k)) || 'Comentario';
            const description = props[descKey]?.rich_text?.[0]?.plain_text || '';

            let clientId = undefined;

            // Strategy 1: Look for explicit 'relation' property with common names
            const explicitClientKey = keys.find(k => /cliente|empresa|lead|relation/i.test(k) && props[k].type === 'relation');
            if (explicitClientKey && props[explicitClientKey].relation.length > 0) {
                clientId = props[explicitClientKey].relation[0].id;
            }

            // Strategy 2: Fallback to ANY relation property that has a value
            if (!clientId) {
                for (const key of keys) {
                    if (props[key].type === 'relation' && props[key].relation.length > 0) {
                        clientId = props[key].relation[0].id;
                        break;
                    }
                }
            }

            // Strategy 3: Check for Rollups (e.g. "Nombre Cliente")
            // If we find a rollup that looks like a client name, we can use it directly?
            // Or if it's a rollup of the ID.
            if (!clientId) {
                const rollupKey = keys.find(k => /cliente|empresa|lead/i.test(k) && props[k].type === 'rollup');
                if (rollupKey) {
                    const rollup = props[rollupKey].rollup;
                    if (rollup.type === 'array' && rollup.array.length > 0) {
                        // Try to find an ID or Title in the rollup array
                        // This is tricky without knowing the exact structure, but often it's a list of pages or values.
                        // For now, let's just log it if we are debugging, but we can't easily extract ID from a pure value rollup.
                    }
                }
            }

            // Strategy 4: Check for direct Client Name (Select, RichText, Rollup)
            // If we still don't have a clientId, maybe we can find the name directly?
            let clientNameFallback = undefined;
            if (!clientId) {
                const nameKey = keys.find(k => /cliente|empresa|lead/i.test(k));
                if (nameKey) {
                    const prop = props[nameKey];
                    if (prop.type === 'select') clientNameFallback = prop.select?.name;
                    else if (prop.type === 'rich_text') clientNameFallback = prop.rich_text?.[0]?.plain_text;
                    else if (prop.type === 'rollup') {
                        const rollup = prop.rollup;
                        if (rollup.type === 'array') {
                            // Try to get the first string value
                            const firstVal = rollup.array[0];
                            if (firstVal?.type === 'title') clientNameFallback = firstVal.title?.[0]?.plain_text;
                            else if (firstVal?.type === 'rich_text') clientNameFallback = firstVal.rich_text?.[0]?.plain_text;
                            else if (firstVal?.type === 'select') clientNameFallback = firstVal.select?.name;
                        }
                    }
                }
            }

            const dateKey = keys.find(k => /fecha|date/i.test(k));
            const dateStr = props[dateKey]?.date?.start || page.created_time;
            const timestamp = new Date(dateStr).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            let type = 'note';
            const tLower = title.toLowerCase();
            if (tLower.includes('llamada') || tLower.includes('tel')) type = 'call';
            if (tLower.includes('mail') || tLower.includes('correo') || tLower.includes('what')) type = 'email';

            return {
                id: page.id,
                type,
                title,
                timestamp,
                isoDate: dateStr, // Include raw ISO date
                description,
                user: { name: agentName, avatarUrl: '' },
                clientId,
                clientName: clientNameFallback, // Return the fallback name if found
                isSynced: true
            };
        });

        res.json(cleanHistory);

    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/leads (Sync Lead)
app.post('/api/leads', async (req, res) => {
    const databaseId = process.env.NOTION_DATABASE_ID;
    const lead = req.body;

    if (!databaseId) return res.status(500).json({ error: 'Missing NOTION_DATABASE_ID' });

    const properties = {
        "Name": { title: [{ text: { content: lead.name } }] },
        "Dirección": { rich_text: [{ text: { content: lead.address || "" } }] },
        "Teléfono": { phone_number: lead.phone || null },
        "Website": { url: lead.website || null },
        "Clase": { select: { name: lead.clase || "C" } },
        "Responsable": { select: { name: lead.agent || "Sin Asignar" } }
    };

    try {
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: properties
        });
        res.json(response);
    } catch (error) {
        console.error("Error creating lead:", error);
        // Retry logic for simple properties could go here, but keeping it simple for now
        res.status(500).json({ error: error.message });
    }
});

// POST /api/history (Add Note)
app.post('/api/history', async (req, res) => {
    const databaseId = process.env.NOTION_HISTORY_DB_ID;
    const { leadId, text, agent, interactionType } = req.body;

    if (!databaseId) return res.status(500).json({ error: 'Missing NOTION_HISTORY_DB_ID' });

    try {

        // Let's query the DB schema first to be safe
        const db = await notion.databases.retrieve({ database_id: databaseId });
        const props = db.properties;
        const keys = Object.keys(props);

        const titleKey = keys.find(k => props[k].type === 'title') || 'Asesor';
        const relationKey = keys.find(k => props[k].type === 'relation') || 'Cliente';
        const contactKey = keys.find(k => k.toLowerCase().includes('contacto') || k.toLowerCase().includes('prospeccion')) || 'Contacto';
        const commentKey = keys.find(k => /comentario|detalle|descri/i.test(k)) || 'Comentario';
        const dateKey = keys.find(k => /fecha|date/i.test(k)) || 'Fecha';

        const properties = {};
        properties[titleKey] = { title: [{ type: "text", text: { content: agent } }] };

        // Validated Writing: Check if Client column is Relation or Text
        if (props[relationKey].type === 'relation') {
            properties[relationKey] = { relation: [{ id: leadId }] };
        } else if (props[relationKey].type === 'rich_text' || props[relationKey].type === 'title') {
            // If it's text, we can only save the name if we have it, or we might fail linking.
            // The user said: "Si es Texto (Incorrecto): Envío el nombre, pero se pierde el enlace."
            // We need the client name here. We can try to fetch it from the leadId if we don't have it in body.
            // But for now, let's assume the frontend sends 'clientName' or we fetch it.
            // Ideally, we should fetch the lead to get the name if we only have ID.

            // Let's fetch the lead name if we need to write as text
            try {
                const leadPage = await notion.pages.retrieve({ page_id: leadId });
                const leadProps = leadPage.properties;
                const leadTitleKey = Object.keys(leadProps).find(k => leadProps[k].type === 'title');
                const leadName = leadProps[leadTitleKey]?.title?.[0]?.plain_text || "Cliente Desconocido";

                properties[relationKey] = { rich_text: [{ type: "text", text: { content: leadName } }] };
            } catch (e) {
                console.error("Could not fetch lead name for text fallback:", e);
                properties[relationKey] = { rich_text: [{ type: "text", text: { content: "ID: " + leadId } }] };
            }
        }

        properties[contactKey] = { rich_text: [{ type: "text", text: { content: interactionType } }] };
        properties[commentKey] = { rich_text: [{ type: "text", text: { content: text } }] };
        if (props[dateKey]) {
            properties[dateKey] = { date: { start: new Date().toISOString() } };
        }

        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: properties
        });

        res.json(response);

    } catch (error) {
        console.error("Error adding history:", error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/pages/:id (Update Page)
app.patch('/api/pages/:id', async (req, res) => {
    const { id } = req.params;
    const { properties, archived } = req.body;

    try {
        const response = await notion.pages.update({
            page_id: id,
            properties,
            archived
        });


        res.json(response);
    } catch (error) {
        console.error("Error updating page:", error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy for N8N Webhook to avoid CORS issues
app.post('/api/webhook', async (req, res) => {
    console.log("Recibida petición de webhook (POST):", req.body);
    const webhookUrl = 'https://automatizaciones-n8n.tzudkj.easypanel.host/webhook/COTIZACION';

    try {
        console.log("Enviando POST a N8N:", webhookUrl);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        console.log("Respuesta N8N:", response.status, response.statusText);

        if (response.ok) {
            res.json({ success: true });
        } else {
            const text = await response.text();
            console.error("Error body N8N:", text);
            res.status(response.status).json({ error: 'Webhook failed', details: text });
        }
    } catch (error) {
        console.error('Webhook Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
