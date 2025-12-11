import React, { useState } from 'react';
import { Lead } from '../types';

interface MainContentProps {
  leads: Lead[];
  history: any[]; // Added history prop
  toggleSelectLead: (id: string) => void;
  onSyncToNotion: () => void;
  isSyncing: boolean;
  onClassChange: (id: string, newClass: string) => void;
  onGenerateDailyReport: () => void; // Handler for daily report
}

const getClassStyles = (clase: string) => {
  switch (clase) {
    case 'A': return 'text-emerald-400 font-bold';
    case 'B': return 'text-blue-400 font-semibold';
    default: return 'text-gray-500 font-medium'; // C
  }
};

const MainContent: React.FC<MainContentProps> = ({ leads, history, toggleSelectLead, onSyncToNotion, isSyncing, onClassChange, onGenerateDailyReport }) => {
  const [filterText, setFilterText] = useState('');

  const selectedCount = leads.filter(l => l.isSelected).length;

  // Logic to filter leads by name, class, or phone
  const filteredLeads = leads.filter(lead => {
    if (!filterText) return true;
    const search = filterText.toLowerCase();
    return (
      lead.name.toLowerCase().includes(search) ||
      (lead.clase && lead.clase.toLowerCase().includes(search)) ||
      (lead.phone && lead.phone.toLowerCase().includes(search))
    );
  }).sort((a, b) => {
    // Custom sort order: A -> B -> C -> Everything else
    const order: { [key: string]: number } = { 'A': 1, 'B': 2, 'C': 3 };
    const valA = order[a.clase || ''] || 99; // Default to 99 if undefined/unknown
    const valB = order[b.clase || ''] || 99;

    // Primary sort by Class
    if (valA !== valB) return valA - valB;

    // Secondary sort by Name (optional, for consistency)
    return a.name.localeCompare(b.name);
  });

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0 h-full overflow-hidden">
      {/* Search Header - Fixed at top via Flexbox (shrink-0) */}
      <div className="p-4 md:p-6 shrink-0 z-10">
        <div className="glass-panel rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shadow-glass">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-3 text-gray-500">search</span>
            <input
              className="w-full bg-transparent border-none text-white text-sm focus:ring-0 block pl-12 p-2.5 placeholder-gray-500 font-medium transition-all"
              placeholder="Filtrar por nombre, clase (A, B, C) o teléfono..."
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end pr-2">
            <button
              onClick={onGenerateDailyReport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all font-bold text-xs md:text-sm animate-in fade-in slide-in-from-right-4 duration-300 hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-red-600">picture_as_pdf</span>
              <span>Reporte Diario</span>
            </button>
          </div>
        </div>
      </div>

      {/* List Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 scroll-smooth">
        <div className="flex flex-col gap-3">
          {/* Header of List */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] sm:grid-cols-[auto_1fr_96px_192px_40px] items-center px-6 py-2 text-[10px] font-bold text-white uppercase tracking-widest hidden sm:grid">
            <div className="w-8 hidden sm:block"></div> {/* Checkbox placeholder */}
            <div className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">Cliente / Empresa</div>
            <div className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider text-center w-24 hidden sm:block">Clase</div>
            <div className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider text-right hidden md:block">Contacto</div>
            <div className="w-10"></div> {/* More options placeholder */}
          </div>

          {/* List Items */}
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => toggleSelectLead(lead.id)}
              className={`
                group flex items-start gap-3 md:gap-5 p-4 rounded-xl border transition-all duration-300 cursor-pointer
                ${lead.isSelected
                  ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-lg'
                }
              `}
            >
              <div className="pt-1.5 w-8 flex-none">
                <input
                  type="checkbox"
                  checked={lead.isSelected}
                  onChange={() => { }} // Controlled by parent click, or keep empty to avoid warning
                  onClick={(e) => { e.stopPropagation(); toggleSelectLead(lead.id); }}
                  className="rounded border-white/20 bg-black/50 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer hover:border-white/40 transition-colors"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h4 className={`font-semibold text-sm md:text-base truncate max-w-full transition-all ${lead.isSelected ? 'text-white text-glow scale-[1.01]' : 'text-white'}`}>
                    {lead.name}
                  </h4>
                  <a className="text-white hover:text-gray-300 transition-colors flex items-center p-1 rounded hover:bg-white/10" href={lead.website || '#'} target="_blank" rel="noreferrer">
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                  {lead.isSynced && (
                    <span className="flex items-center gap-1.5 text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full border border-white/10 shadow-sm animate-in fade-in" title="Sincronizado con Notion">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" className="w-3 h-3 grayscale brightness-200" alt="synced" />
                      <span className="hidden sm:inline font-medium tracking-wide">Synced</span>
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-2 text-white text-xs md:text-sm">
                  <span className="material-symbols-outlined text-[16px] mt-0.5 flex-none opacity-100">location_on</span>
                  <span className="line-clamp-2">{lead.address}</span>
                </div>
                {/* Phone number visible on mobile/tablet */}
                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm mt-1 lg:hidden">
                  <span className="material-symbols-outlined text-[16px] flex-none opacity-70">call</span>
                  <span className="font-mono">{lead.phone}</span>
                </div>
              </div>

              {/* CLASE DROPDOWN */}
              <div className="w-24 flex items-center justify-center">
                <div className="hidden sm:flex items-center justify-center w-24">
                  <select
                    value={lead.clase}
                    onChange={(e) => {
                      e.stopPropagation();
                      onClassChange(lead.id, e.target.value);
                    }}
                    className={`
                                            appearance-none text-[10px] font-bold px-2 py-1 rounded border bg-black/50 outline-none cursor-pointer transition-all hover:bg-black/80
                                            ${lead.clase === 'A' ? 'text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : ''}
                                            ${lead.clase === 'B' ? 'text-blue-400 border-blue-500/30' : ''}
                                            ${lead.clase === 'C' ? 'text-gray-400 border-gray-500/30' : ''}
                                        `}
                  >
                    <option value="A">Clase A</option>
                    <option value="B">Clase B</option>
                    <option value="C">Clase C</option>
                  </select>
                </div>
                <div className="hidden md:flex flex-col items-end gap-1 text-right">
                  <span className="material-symbols-outlined text-[14px] absolute right-1.5 top-1.5 text-gray-500 pointer-events-none group-hover/clase:text-white transition-colors">expand_more</span>
                </div>
              </div>

              {/* Desktop Columns */}
              < div className="w-48 hidden lg:flex flex-col justify-center gap-1" >
                <div className="flex items-center gap-2 text-white text-sm">
                  <span className="material-symbols-outlined text-[16px] text-white">call</span>
                  <span className="font-mono text-xs hover:text-gray-300 transition-colors cursor-text selection:bg-white/20">{lead.phone}</span>
                </div>
                <div className="text-xs text-white truncate hover:text-gray-300 cursor-pointer transition-colors pl-6 hover:underline">{lead.website || 'No website'}</div>
              </div>

              <div className="w-10 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-gray-500 hover:text-white p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-all"><span className="material-symbols-outlined">more_horiz</span></button>
              </div>
            </div>
          ))}

          {filteredLeads.length === 0 && (
            <div className="glass-panel rounded-2xl flex flex-col items-center justify-center py-20 text-gray-500 border-dashed border-white/10 animate-in fade-in zoom-in-95">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl opacity-50">search_off</span>
              </div>
              <p className="text-sm font-medium">No se encontraron resultados.</p>
            </div>
          )}
        </div>
      </div >
    </main >
  );
};

export default MainContent;