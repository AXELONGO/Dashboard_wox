
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import MainContent from './components/MainContent';
import RightSidebar from './components/RightSidebar';
import QuotesView from './components/QuotesView';
import Chatbot from './components/Chatbot';
import { Lead, HistoryItem } from './types';
import { generateLeadsByLocation } from './services/geminiService';
import { generatePDF, generateDailyReportPDF } from './services/pdfService';
import {
    syncLeadToNotion,
    getLeadsFromNotion,
    getHistoryFromNotionDatabase,
    addHistoryToNotionDatabase,
    updateLeadClass
} from './services/notionService';

import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';

// Initial Mock Data (Fallback)
const FALLBACK_LEADS: Lead[] = [];
const INITIAL_HISTORY: HistoryItem[] = [];


const AppContent: React.FC = () => {
    const [user, setUser] = useState<any>(null);

    // Check for existing session (optional, for persistence)
    useEffect(() => {
        const storedUser = localStorage.getItem('user_session');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogin = (userData: any) => {
        setUser(userData);
        localStorage.setItem('user_session', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user_session');
    };

    if (!user) {
        return <Login onLoginSuccess={handleLogin} />;
    }

    // --- STATE: Data ---
    // These states are no longer directly used by App.tsx's rendering logic
    // as NotionDataViewer handles its own data.
    // Keeping them commented out for now in case they are needed by other components
    // or if the data flow changes later.
    const [leads, setLeads] = useState<Lead[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
    const [globalHistory, setGlobalHistory] = useState<HistoryItem[]>([]);

    // --- STATE: UI & Async Status ---
    const [activeTab, setActiveTab] = useState<'ventas' | 'cotizaciones'>('ventas');
    // These states are no longer directly used by App.tsx's rendering logic.
    // Keeping them commented out for now.
    const [isSearching, setIsSearching] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoadingNotion, setIsLoadingNotion] = useState(true);

    const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

    // The useEffect hook for initial data loading is removed as NotionDataViewer
    // now handles its own data fetching.
    useEffect(() => {
        const initData = async () => {
            setIsLoadingNotion(true);
            try {
                const [notionLeads, notionHistory] = await Promise.all([
                    getLeadsFromNotion(),
                    getHistoryFromNotionDatabase() // Global load
                ]);

                if (notionLeads.length > 0) {
                    setLeads(notionLeads);
                } else {
                    setLeads(FALLBACK_LEADS);
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

            } catch (error) {
                console.error("Fallo crítico al cargar datos:", error);
                setLeads(FALLBACK_LEADS);
            } finally {
                setIsLoadingNotion(false);
            }
        };
        initData();
    }, []);

    // All lead-related functions (handleSearchLeads, toggleSelectLead, handleClassChange,
    // handleSaveNote, handleExport) are removed as they are no longer used by the simplified App.tsx.
    const handleSearchLeads = async (location: string) => {
        setIsSearching(true);
        if (window.innerWidth < 1024) {
            setIsLeftSidebarOpen(false);
        }

        const webhookUrl = 'https://automatizaciones-n8n.tzudkj.easypanel.host/webhook/Leads';

        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location: location,
                timestamp: new Date().toISOString(),
                action: "search_leads"
            })
        }).catch(err => console.error("WebHook Error", err));

        try {
            const newLeadsData = await generateLeadsByLocation(location);
            const newLeads: Lead[] = newLeadsData.map((l, index) => ({
                ...l,
                id: `gen-${Date.now()}-${index}`,
                isSelected: false,
                isSynced: false,
                clase: 'C',
                category: (['Transporte', 'Software', 'Consultoría', 'Industrial'].includes(l.category) ? l.category : 'Otros') as Lead['category']
            }));
            setLeads(prev => [...newLeads, ...prev]);
        } catch (e) {
            console.error("Failed to generate leads", e);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleSelectLead = async (id: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, isSelected: !l.isSelected } : { ...l, isSelected: false }));

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
                        // IMPORTANTE: Los items frescos no tienen nombre. Se lo pegamos:
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
        // Optimistic
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
        const selectedLead = leads.find(l => l.isSelected);
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

        // Mostrar inmediatamente
        setHistory(prev => [optimisticItem, ...prev]);
        setGlobalHistory(prev => [optimisticItem, ...prev]);

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

            // 1. Si el lead no está sincronizado, sincronizarlo primero
            if (!selectedLead.isSynced) {
                const synced = await syncLeadToNotion(selectedLead);
                if (synced) {
                    targetLeadId = selectedLead.id; // El ID se actualizó in-place en syncLeadToNotion
                    // Actualizar estado del lead
                    setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, id: targetLeadId, isSynced: true } : l));
                } else {
                    console.error("No se pudo sincronizar el lead. La nota no se guardará en Notion.");
                    // Aún así dejamos la nota local
                    return;
                }
            }

            // 2. Guardar la nota asociada al ID real
            const createdItem = await addHistoryToNotionDatabase(targetLeadId, text, agent, interactionType);

            if (createdItem) {
                // ÉXITO: Actualizamos el ítem con ID real Y NOMBRE
                const newItemWithClientName = {
                    ...createdItem,
                    clientName: selectedLead.name,
                    clientWebsite: selectedLead.website
                };

                setHistory(prev => prev.map(item => item.id === tempId ? newItemWithClientName : item));
                setGlobalHistory(prev => prev.map(item => item.id === tempId ? newItemWithClientName : item));
            } else {
                console.error("No se pudo guardar la nota en Notion. Se mantendrá localmente hasta recargar.");
            }
        } catch (error) {
            console.error("Error en flujo de guardado:", error);
        }
    };

    const handleExport = async () => {
        const selectedLead = leads.find(l => l.isSelected);
        if (!selectedLead) return;

        setIsSyncing(true);
        try {
            if (!selectedLead.isSynced) {
                await syncLeadToNotion(selectedLead);
                setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, isSynced: true } : l));
            }
            generatePDF(selectedLead, history);
        } catch (error) {
            console.error("Export failed", error);
            alert("Hubo un error al generar la exportación.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative font-display bg-obsidian">
            <Header
                onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                user={user} // Pass user to Header if needed
                onLogout={handleLogout} // Pass logout handler
            />

            <div className="flex flex-col flex-1 overflow-hidden relative">
                <div className="flex flex-1 overflow-hidden relative">
                    {activeTab === 'ventas' ? (
                        <>
                            <LeftSidebar
                                onSearchLeads={handleSearchLeads}
                                isSearching={isSearching}
                                isOpen={isLeftSidebarOpen}
                                onClose={() => setIsLeftSidebarOpen(false)}
                                selectedLeadName={leads.find(l => l.isSelected)?.name}
                                selectedLeadAgent={leads.find(l => l.isSelected)?.agent}
                                onSaveNote={handleSaveNote}
                            />

                            <RightSidebar
                                history={history}
                                isOpen={isRightSidebarOpen}
                                onClose={() => setIsRightSidebarOpen(false)}
                                leadName={leads.find(l => l.isSelected)?.name}
                            />

                            <MainContent
                                leads={leads}
                                history={history}
                                toggleSelectLead={toggleSelectLead}
                                onSyncToNotion={handleExport}
                                isSyncing={isSyncing}
                                onClassChange={handleClassChange}
                                onGenerateDailyReport={() => generateDailyReportPDF(history)}
                            />
                        </>
                    ) : (
                        <QuotesView leads={leads} />
                    )}
                </div>
            </div>

            <Chatbot />
        </div>
    );
};

const App: React.FC = () => {
    // IMPORTANTE: Reemplazar con tu Client ID real de Google Cloud Console
    // El usuario debe poner esto en su .env como VITE_GOOGLE_CLIENT_ID
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "TU_CLIENT_ID_AQUI";

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <AppContent />
        </GoogleOAuthProvider>
    );
};

export default App;


