import React, { useState } from 'react';
import { Lead } from '../types';

interface ClientsViewProps {
    clients: Lead[];
    history: any[];
    toggleSelectClient: (id: string) => void;
    onSyncToNotion: () => void;
    isSyncing: boolean;
    onClassChange: (id: string, newClass: string) => void;
}

const getClassStyles = (clase: string) => {
    switch (clase) {
        case 'A': return 'text-emerald-400 font-bold';
        case 'B': return 'text-blue-400 font-semibold';
        default: return 'text-gray-500 font-medium'; // C
    }
};

const ClientsView: React.FC<ClientsViewProps> = ({ clients, toggleSelectClient, onClassChange }) => {
    const [filterText, setFilterText] = useState('');

    // Logic to filter clients by name, class, or phone
    const filteredClients = clients.filter(client => {
        if (!filterText) return true;
        const search = filterText.toLowerCase();
        return (
            client.name.toLowerCase().includes(search) ||
            (client.clase && client.clase.toLowerCase().includes(search)) ||
            (client.phone && client.phone.toLowerCase().includes(search))
        );
    });

    return (
        <main className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0 h-full overflow-hidden">
            {/* Search Header */}
            <div className="p-4 md:p-6 shrink-0 z-10">
                <div className="glass-panel rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shadow-glass">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-3 text-gray-500">search</span>
                        <input
                            className="w-full bg-transparent border-none text-white text-sm focus:ring-0 block pl-12 p-2.5 placeholder-gray-500 font-medium transition-all"
                            placeholder="Filtrar clientes por nombre, clase o teléfono..."
                            type="text"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 justify-end pr-2">
                        <button className="flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors active:scale-95">
                            <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        </button>
                        <button className="flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors active:scale-95">
                            <span className="material-symbols-outlined text-[20px]">sort</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 scroll-smooth">
                <div className="flex flex-col gap-3">
                    {/* Header of List */}
                    <div className="flex items-center px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:flex">
                        <div className="w-8"></div>
                        <div className="flex-1">Cliente / Empresa</div>
                        <div className="w-24 text-center">Clase</div>
                        <div className="w-48 hidden lg:block">Contacto</div>
                        <div className="w-10"></div>
                    </div>

                    {/* List Items */}
                    {filteredClients.map((client) => (
                        <div
                            key={client.id}
                            className={`
                group flex items-start gap-3 md:gap-5 p-4 rounded-xl border transition-all duration-300
                ${client.isSelected
                                    ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-lg'
                                }
              `}
                        >
                            <div className="pt-1.5 w-8 flex-none">
                                <input
                                    type="checkbox"
                                    checked={client.isSelected}
                                    onChange={() => toggleSelectClient(client.id)}
                                    className="rounded border-white/20 bg-black/50 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer hover:border-white/40 transition-colors"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                    <h4 className={`font-semibold text-sm md:text-base truncate max-w-full transition-all ${client.isSelected ? 'text-white text-glow scale-[1.01]' : 'text-gray-200'}`}>
                                        {client.name}
                                    </h4>
                                    <a className="text-gray-500 hover:text-white transition-colors flex items-center p-1 rounded hover:bg-white/10" href={client.website || '#'} target="_blank" rel="noreferrer">
                                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                    </a>
                                </div>
                                <div className="flex items-start gap-2 text-gray-500 text-xs md:text-sm">
                                    <span className="material-symbols-outlined text-[16px] mt-0.5 flex-none opacity-70">location_on</span>
                                    <span className="line-clamp-2">{client.address}</span>
                                </div>
                                {/* Phone number visible on mobile/tablet */}
                                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm mt-1 lg:hidden">
                                    <span className="material-symbols-outlined text-[16px] flex-none opacity-70">call</span>
                                    <span className="font-mono">{client.phone}</span>
                                </div>
                            </div>

                            {/* CLASE DROPDOWN */}
                            <div className="w-24 flex items-center justify-center">
                                <div className="relative group/clase" onClick={(e) => e.stopPropagation()}>
                                    <select
                                        value={client.clase}
                                        onChange={(e) => onClassChange(client.id, e.target.value)}
                                        className={`bg-black/40 border border-white/10 rounded-md text-xs py-1 pl-2 pr-6 appearance-none cursor-pointer focus:ring-1 focus:ring-white/20 outline-none backdrop-blur-sm transition-all hover:border-white/20 ${getClassStyles(client.clase)}`}
                                    >
                                        <option value="A" className="bg-slate-900 text-emerald-400">Clase A</option>
                                        <option value="B" className="bg-slate-900 text-blue-400">Clase B</option>
                                        <option value="C" className="bg-slate-900 text-gray-400">Clase C</option>
                                    </select>
                                    <span className="material-symbols-outlined text-[14px] absolute right-1.5 top-1.5 text-gray-500 pointer-events-none group-hover/clase:text-white transition-colors">expand_more</span>
                                </div>
                            </div>

                            {/* Desktop Columns */}
                            <div className="w-48 hidden lg:flex flex-col justify-center gap-1">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <span className="material-symbols-outlined text-[16px] text-white/50">call</span>
                                    <span className="font-mono text-xs hover:text-white transition-colors cursor-text selection:bg-white/20">{client.phone}</span>
                                </div>
                                <div className="text-xs text-gray-600 truncate hover:text-white cursor-pointer transition-colors pl-6 hover:underline">{client.website || 'No website'}</div>
                            </div>

                            <div className="w-10 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-gray-500 hover:text-white p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-all"><span className="material-symbols-outlined">more_horiz</span></button>
                            </div>
                        </div>
                    ))}

                    {filteredClients.length === 0 && (
                        <div className="glass-panel rounded-2xl flex flex-col items-center justify-center py-20 text-gray-500 border-dashed border-white/10 animate-in fade-in zoom-in-95">
                            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-4xl opacity-50">search_off</span>
                            </div>
                            <p className="text-sm font-medium">No se encontraron clientes.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default ClientsView;
