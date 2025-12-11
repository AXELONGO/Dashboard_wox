
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import MainContent from './components/MainContent';
import QuotesView from './components/QuotesView';
import ClientsView from './components/ClientsView';
import MassSenderView from './components/MassSenderView';
import Chatbot from './components/Chatbot';
import { Lead, HistoryItem } from './types';
import { generatePDF, generateDailyReportPDF, generateDateRangeReportPDF } from './services/pdfService';
import DateRangeModal from './components/DateRangeModal';
import {
    syncLeadToNotion,
    getLeadsFromNotion,
    getHistoryFromNotionDatabase,
    addHistoryToNotionDatabase,
    updateLeadClass,
    getClientsFromNotion,
    getClientsHistoryFromNotionDatabase,
    getSupportTicketsFromNotion,
    addClientHistoryToNotionDatabase // Import the client history function
} from './services/notionService';


// Initial Mock Data (Fallback)
const FALLBACK_LEADS: Lead[] = [];
const INITIAL_HISTORY: HistoryItem[] = [];

interface DashboardProps {
    user: any;
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    // --- STATE: Data ---
    const [leads, setLeads] = useState<Lead[]>([]);
    const [clients, setClients] = useState<Lead[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
    const [globalHistory, setGlobalHistory] = useState<HistoryItem[]>([]);
    const [clientsHistory, setClientsHistory] = useState<HistoryItem[]>([]);
    const [supportTickets, setSupportTickets] = useState<any[]>([]);

    // --- STATE: UI & Async Status ---
    const [activeTab, setActiveTab] = useState<'ventas' | 'cotizaciones' | 'clientes' | 'masivos'>('ventas');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoadingNotion, setIsLoadingNotion] = useState(true);

    const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024); // Default open on desktop, closed on mobile
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        const initData = async () => {
            setIsLoadingNotion(true);
            try {
                const [notionLeads, notionHistory, notionClients, notionClientsHistory, notionSupport] = await Promise.all([
                    getLeadsFromNotion(),
                    getHistoryFromNotionDatabase(),
                    getClientsFromNotion(),
                    getClientsHistoryFromNotionDatabase(),
                    getSupportTicketsFromNotion()
                ]);

                if (notionLeads.length > 0) {
                    setLeads(notionLeads);
                } else {
                    setLeads(FALLBACK_LEADS);
                }

                if (notionClients.length > 0) {
                    setClients(notionClients);
                }

                if (notionSupport) {
                    setSupportTickets(notionSupport);
                }

                // Cruzamos datos para poner nombres a las tarjetas
                const enrichedHistory = notionHistory.map(h => {
                    const client = notionLeads.find(l => l.id === h.clientId);
                    return {
                        ...h,
                        clientName: client ? client.name : (h.clientName || (h.clientId ? 'Cargando...' : 'Sin Asignar')),
                        clientWebsite: client ? client.website : undefined
                    };
                });

                setGlobalHistory(enrichedHistory);
                setHistory(enrichedHistory);
                setClientsHistory(notionClientsHistory);

            } catch (error) {
                console.error("Fallo crítico al cargar datos:", error);
                setLeads(FALLBACK_LEADS);
            } finally {
                setIsLoadingNotion(false);
            }
        };
        initData();
    }, []);

    // --- EFFECT: Switch History Context on Tab Change ---
    useEffect(() => {
        // When tab changes, reset selection and switch history source
        setActiveLeadId(null);

        // Also clear selections in state to avoid confusion
        setLeads(prev => prev.map(l => ({ ...l, isSelected: false })));
        setClients(prev => prev.map(c => ({ ...c, isSelected: false })));

        if (activeTab === 'clientes') {
            // Enrich clients history with client names
            const enrichedClientsHistory = clientsHistory.map(h => {
                const client = clients.find(c => c.id === h.clientId);
                return {
                    ...h,
                    clientName: client ? client.name : (h.clientName || 'Cliente'),
                    clientWebsite: client ? client.website : undefined
                };
            });
            // Show Clients History Global (or empty if preferred, but user implies seeing history)
            setHistory(enrichedClientsHistory.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
        } else if (activeTab === 'ventas') {
            // Show Sales Global History
            setHistory(globalHistory);
        }
        // For other tabs we might not care or keep previous
    }, [activeTab, globalHistory, clientsHistory, clients]);

    const toggleSelectLead = async (id: string) => {
        if (activeTab === 'clientes') {
            setClients(prev => prev.map(c => {
                if (c.id === id) {
                    const newSelectedState = !c.isSelected;
                    if (newSelectedState) {
                        setIsLeftSidebarOpen(true);
                    }
                    return { ...c, isSelected: newSelectedState };
                }
                return { ...c, isSelected: false };
            }));

            const targetClient = clients.find(c => c.id === id);
            const willBeSelected = targetClient && !targetClient.isSelected;

            if (willBeSelected) {
                // Filter CLIENTS HISTORY
                const clientEvents = clientsHistory.filter(h => h.clientId === id);
                // Enrich with client name for display
                const enrichedEvents = clientEvents.map(h => ({
                    ...h,
                    clientName: targetClient.name,
                    clientWebsite: targetClient.website
                }));
                setHistory(enrichedEvents);
            } else {
                // For clients tab fallback
                const allClientsEvents = clientsHistory.map(h => {
                    const c = clients.find(cl => cl.id === h.clientId);
                    return {
                        ...h,
                        clientName: c ? c.name : 'Unknown',
                        clientWebsite: c ? c.website : undefined
                    };
                });
                setHistory(allClientsEvents);
            }
            return;
        }

        setLeads(prev => prev.map(l => {
            if (l.id === id) {
                const newSelectedState = !l.isSelected;
                if (newSelectedState) {
                    setIsLeftSidebarOpen(true);
                }
                return { ...l, isSelected: newSelectedState };
            }
            return { ...l, isSelected: false };
        }));

        const targetLead = leads.find(l => l.id === id);
        const willBeSelected = targetLead && !targetLead.isSelected;

        if (willBeSelected) {
            setActiveLeadId(id);

            // 1. Mostrar filtro local instantáneo
            const localFiltered = globalHistory.filter(h => h.clientId === id);
            setHistory(localFiltered);

            // 2. Refrescar datos desde Notion para asegurar que vemos lo último
            if (targetLead?.isSynced) {
                getHistoryFromNotionDatabase(id).then(notionHistory => {
                    if (notionHistory.length > 0) {
                        const enrichedFresh = notionHistory.map(h => ({
                            ...h,
                            clientName: targetLead.name,
                            clientWebsite: targetLead.website
                        }));

                        setHistory(enrichedFresh);

                        // Actualizar caché global
                        setGlobalHistory(prev => {
                            const otherItems = prev.filter(p => p.clientId !== id);
                            return [...enrichedFresh, ...otherItems].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
                        });
                    }
                });
            }
        } else {
            setActiveLeadId(null);
            setHistory(globalHistory);
        }
    };


    const handleClassChange = async (id: string, newClass: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, clase: newClass as 'A' | 'B' | 'C' } : l));

        const lead = leads.find(l => l.id === id);
        if (lead && lead.isSynced) {
            const success = await updateLeadClass(id, newClass, lead.notionData);
            if (!success) {
                console.warn("Fallo al actualizar Clase en Notion");
            }
        }
    };

    const handleSaveNote = async (text: string, agent: string, interactionType: string) => {
        const selectedLead = activeTab === 'clientes'
            ? clients.find(c => c.isSelected)
            : leads.find(l => l.isSelected);

        if (!selectedLead) return;

        const tempId = `temp-${Date.now()}`;

        const optimisticItem: HistoryItem = {
            id: tempId,
            type: interactionType.toLowerCase().includes('mail') || interactionType.toLowerCase().includes('correo') ? 'email' : 'note',
            title: interactionType,
            timestamp: "Enviando...",
            description: text,
            user: { name: agent, avatarUrl: '' },
            clientId: selectedLead.id,
            clientName: selectedLead.name,
            clientWebsite: selectedLead.website,
            isSynced: false
        };

        setHistory(prev => [optimisticItem, ...prev]);

        // Only update global history if it's the main sales flow, otherwise we might be in clients history scope
        // But simplifying, we can update global if keeping track
        if (activeTab === 'ventas') {
            setGlobalHistory(prev => [optimisticItem, ...prev]);
        }

        // Webhook N8N
        const webhookUrl = 'https://automatizaciones-n8n.tzudkj.easypanel.host/webhook/CARGAR NOTAS';
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente: selectedLead.name,
                asignar_a: agent,
                detalle: text,
                contacto: interactionType,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.error("Webhook Note Error", err));

        // Guardar en Notion
        try {
            let targetLeadId = selectedLead.id;

            // 1. Si el lead no está sincronizado, sincronizarlo primero (Sólo para Leads de Ventas)
            // Para Clientes, asumimos que ya tienen ID real de Notion porque vienen de la DB
            if (activeTab === 'ventas' && !selectedLead.isSynced) {
                const synced = await syncLeadToNotion(selectedLead);
                if (synced) {
                    targetLeadId = selectedLead.id;
                    setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, id: targetLeadId, isSynced: true } : l));
                } else {
                    console.error("No se pudo sincronizar el lead. La nota no se guardará en Notion.");
                    return;
                }
            }

            // 2. Guardar la nota (Contextual)
            let createdItem: HistoryItem | null = null;

            if (activeTab === 'clientes') {
                // Save to CLIENTS DB
                createdItem = await addClientHistoryToNotionDatabase(targetLeadId, text, agent, interactionType);
            } else {
                // Save to SALES/LEADS DB
                createdItem = await addHistoryToNotionDatabase(targetLeadId, text, agent, interactionType);
            }

            if (createdItem) {
                const newItemWithClientName = {
                    ...createdItem,
                    clientName: selectedLead.name,
                    clientWebsite: selectedLead.website
                };

                // Update local state immediately
                setHistory(prev => [newItemWithClientName, ...prev]);

                // Update backing stores
                if (activeTab === 'ventas') {
                    setGlobalHistory(prev => [newItemWithClientName, ...prev]);
                } else if (activeTab === 'clientes') {
                    setClientsHistory(prev => [newItemWithClientName, ...prev]);
                }
            } else {
                console.error("No se pudo guardar la nota en Notion.");
            }
        } catch (error) {
            console.error("Error en flujo de guardado:", error);
        }
    };

    return (
        <div className="flex flex-col h-full relative font-display bg-obsidian">
            <Header
                onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                onToggleRightSidebar={() => { }} // No-op, removed right sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={onLogout}
            />

            <div className="flex flex-col flex-1 overflow-hidden relative">
                <div className="flex flex-1 overflow-hidden relative">

                    {/* Unified Left Sidebar for all tabs (except Masivos? or maybe inclusive) */}
                    {/* We keep it persistent if desired, or conditional. Let's keep it persistent for consistency. */}
                    {activeTab !== 'masivos' && (
                        <LeftSidebar
                            isOpen={isLeftSidebarOpen}
                            onClose={() => setIsLeftSidebarOpen(false)}
                            history={history}
                            supportTickets={supportTickets}
                            selectedLeadName={
                                activeTab === 'clientes'
                                    ? clients.find(c => c.isSelected)?.name
                                    : leads.find(l => l.isSelected)?.name
                            }
                            onSaveNote={handleSaveNote}
                        />
                    )}

                    {activeTab === 'ventas' ? (
                        <MainContent
                            leads={leads}
                            history={history}
                            toggleSelectLead={toggleSelectLead}
                            onSyncToNotion={syncLeadToNotion}
                            isSyncing={isSyncing}
                            onClassChange={handleClassChange}
                            onGenerateDailyReport={() => setIsReportModalOpen(true)}
                        />
                    ) : activeTab === 'cotizaciones' ? (
                        <QuotesView leads={leads} onBack={() => setActiveTab('ventas')} />
                    ) : activeTab === 'clientes' ? (
                        <ClientsView
                            clients={clients}
                            history={clientsHistory}
                            toggleSelectClient={toggleSelectLead}
                            onSyncToNotion={syncLeadToNotion}
                            isSyncing={isSyncing}
                            onClassChange={handleClassChange}
                        />
                    ) : (
                        <MassSenderView />
                    )}
                </div>
            </div>

            <Chatbot />
            <DateRangeModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onGenerate={(start, end) => generateDateRangeReportPDF(globalHistory, start, end)}
            />
        </div>
    );
};

const App: React.FC = () => {
    const mockUser = { name: "Usuario", email: "admin@erp.com" };

    return <Dashboard user={mockUser} onLogout={() => console.log("Logout disabled")} />;
};

export default App;
