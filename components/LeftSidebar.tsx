import React, { useState } from 'react';

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: any[];
  supportTickets: any[];
  selectedLeadName?: string;
  // For adding notes/history
  onSaveNote: (text: string, agent: string, type: string) => void;
}

const AGENTS = ['Asesor 1', 'Asesor 2', 'Asesor 3'];
const INTERACTION_TYPES = ['WhatsApp', 'Correo', 'Llamada', 'Presencial'];

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onClose,
  history,
  supportTickets,
  selectedLeadName,
  onSaveNote
}) => {
  const [activeTab, setActiveTab] = useState<'historial' | 'soporte'>('historial');
  const [noteText, setNoteText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [interactionType, setInteractionType] = useState('WhatsApp');

  const handleSave = () => {
    if (!noteText.trim()) return;
    onSaveNote(noteText, selectedAgent, interactionType);
    setNoteText('');
    setInteractionType('WhatsApp');
  };

  return (
    <aside
      className={`
            fixed inset-y-0 left-0 z-40 bg-black/40 backdrop-blur-2xl border-r border-glass-border flex flex-col overflow-y-auto duration-500 cubic-bezier(0.19, 1, 0.22, 1)
            w-[85%] sm:w-[380px] lg:static lg:translate-x-0 lg:flex
            ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
    >
      {/* Header / Tabs */}
      <div className="p-6 pb-0 flex flex-col gap-6 bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-white font-bold text-xl text-glow">Panel Lateral</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'historial'
              ? 'bg-btn-primary text-black shadow-lg shadow-white/5'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Historial
          </button>
          <button
            onClick={() => setActiveTab('soporte')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'soporte'
              ? 'bg-btn-primary text-black shadow-lg shadow-white/5'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            Soporte
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">

        {activeTab === 'historial' && (
          <div className="space-y-6">
            {/* Quick Add Note */}
            <div className="flex flex-col gap-3">
              <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 border border-white/10 shadow-lg">
                {selectedLeadName ? (
                  <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    {selectedLeadName}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-white font-bold uppercase tracking-wider mb-1">
                    <span className="material-symbols-outlined text-[14px]">public</span>
                    Historial Global
                  </div>
                )}

                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="bg-black/20 border border-white/5 rounded-lg text-sm px-3 py-2 resize-none h-20 focus:ring-1 focus:ring-white/20 outline-none text-white placeholder-gray-600"
                  placeholder="Agregar nota rápida..."
                ></textarea>

                <div className="flex gap-2">
                  <select
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value)}
                    className="bg-black/20 border border-white/5 rounded-lg text-xs px-2 py-1.5 text-gray-300 outline-none flex-1"
                  >
                    {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button
                    onClick={handleSave}
                    className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg transition-colors disabled:opacity-50"
                    disabled={!selectedLeadName}
                    title={!selectedLeadName ? "Selecciona un cliente para agregar notas" : "Guardar"}
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="relative pl-6 border-l border-white/10 group hover:border-white/30 transition-colors pb-6 last:pb-0">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[5px] top-0 size-2.5 rounded-full bg-[#030711] border border-white/40 group-hover:border-white group-hover:bg-white transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>

                  <div className="flex flex-col gap-2">
                    {/* Header: Date & Client */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-white group-hover:text-white transition-colors">{item.timestamp}</span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded border border-white/10">{item.type}</span>
                      </div>

                      {/* Client Name always visible if available, or strictly if requested to be explicitly shown */}
                      {item.clientName && (
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Use blue dot for client */}
                          <div className="size-1.5 rounded-full bg-blue-500 shadow-glow"></div>
                          <span className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer truncate">
                            {item.clientName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content / Note */}
                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 group-hover:bg-white/[0.05] transition-colors relative">
                      {/* Description */}
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {item.description || item.text || item.title} {/* Ensure fallback to description */}
                      </p>

                      {/* Agent Footer */}
                      <div className="flex items-center gap-2 mt-3 text-[11px] text-white border-t border-white/10 pt-2">
                        <span className="uppercase tracking-wider font-semibold">Asesor:</span>
                        <div className="flex items-center gap-1.5">
                          {/* White/Monochrome Avatar */}
                          <div className="size-4 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-bold shadow-sm" title={item.user?.name || item.agent}>
                            {(item.user?.name || item.agent || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{item.user?.name || item.agent || 'Sistema'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-10 text-gray-600 text-sm">
                  No hay historial disponible.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'soporte' && (
          <div className="space-y-4">
            <section className="flex flex-col gap-3">
              {supportTickets.map((ticket) => (
                <a
                  key={ticket.id}
                  href={ticket.url}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-panel p-3 rounded-xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group block"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h4 className="text-sm font-semibold text-gray-200 group-hover:text-blue-300 transition-colors line-clamp-2">{ticket.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ticket.status?.toLowerCase().includes('completo') || ticket.status?.toLowerCase().includes('done')
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : ticket.status?.toLowerCase().includes('process')
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                    {new Date(ticket.last_edited).toLocaleDateString()}
                    <span className="ml-auto flex items-center gap-1 group-hover:text-white transition-colors">
                      Abrir <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </span>
                  </div>
                </a>
              ))}

              {supportTickets.length === 0 && (
                <div className="glass-panel rounded-2xl flex flex-col items-center justify-center py-12 text-gray-500 border-dashed border-white/10">
                  <span className="material-symbols-outlined text-3xl opacity-50 mb-3">confirmation_number</span>
                  <p className="text-sm text-center">No hay tickets recientes</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;