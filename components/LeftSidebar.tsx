import React, { useState, useEffect } from 'react';

interface LeftSidebarProps {
  onSearchLeads: (location: string) => void;
  isSearching: boolean;
  isOpen: boolean;
  onClose: () => void;
  selectedLeadName?: string;
  selectedLeadAgent?: string;
  onSaveNote: (text: string, agent: string, type: string) => void;
}

const AGENTS = ['Asesor 1', 'Asesor 2', 'Asesor 3'];
// Actualizado con las opciones solicitadas
const INTERACTION_TYPES = ['WhatsApp', 'Correo', 'Llamada', 'Presencial'];

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
    onSearchLeads, 
    isSearching, 
    isOpen, 
    onClose,
    selectedLeadName,
    selectedLeadAgent,
    onSaveNote
}) => {
  const [location, setLocation] = useState('');
  const [noteText, setNoteText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  // Valor por defecto actualizado
  const [interactionType, setInteractionType] = useState('WhatsApp');

  // Update local agent selection when lead changes
  useEffect(() => {
      if (selectedLeadAgent) {
          // Check if the agent exists in our generic list, otherwise default to first
          if (AGENTS.includes(selectedLeadAgent)) {
              setSelectedAgent(selectedLeadAgent);
          } else {
              setSelectedAgent(AGENTS[0]); 
          }
      } else {
          setSelectedAgent(AGENTS[0]);
      }
  }, [selectedLeadAgent]);

  const handleSearch = () => {
    if (location.trim()) {
      onSearchLeads(location);
    }
  };

  const handleSave = () => {
      if (!noteText.trim()) return;
      onSaveNote(noteText, selectedAgent, interactionType);
      setNoteText('');
      setInteractionType('WhatsApp'); // Reset to default
  };

  return (
    <aside 
        className={`
            fixed inset-y-0 left-0 z-40 bg-black/40 backdrop-blur-2xl border-r border-glass-border flex flex-col overflow-y-auto p-6 gap-8 transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1)
            w-[85%] sm:w-[360px] lg:static lg:translate-x-0 lg:flex
            ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
    >
      {/* Mobile Header for Sidebar */}
      <div className="flex items-center justify-between lg:hidden mb-2">
        <h2 className="text-white font-bold text-xl text-glow">Menú Principal</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1 transition-colors">
            <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <nav className="flex flex-col gap-2 md:hidden mb-4 border-b border-white/10 pb-6">
          <a href="#" className="flex items-center gap-3 px-3 py-3 bg-white/5 text-white rounded-lg font-bold text-sm border border-white/10">
              <span className="material-symbols-outlined text-[20px]">leaderboard</span>
              Ventas
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg font-medium text-sm transition-colors">
              <span className="material-symbols-outlined text-[20px]">request_quote</span>
              Cotizaciones
          </a>
      </nav>

      {/* Lead Generator Card */}
      <div className="flex flex-col gap-4">
        <h3 className="text-white text-lg font-semibold tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-white/50 text-[20px]">smart_toy</span>
            Generador AI
        </h3>
        <div className="glass-panel rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          {/* Subtle sheen effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

          <div className="mb-5">
            <div 
              className="bg-cover bg-center h-28 rounded-xl w-full mb-5 relative overflow-hidden shadow-inner border border-white/10" 
              style={{backgroundImage: 'linear-gradient(0deg, rgba(3, 7, 17, 0.7) 0%, rgba(3, 7, 17, 0.2) 100%), url("https://placeholder.pics/svg/300")'}}
            >
              <div className="absolute top-2 right-2 flex gap-1">
                 <div className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
              </div>
              <div className="absolute bottom-3 left-3 text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">radar</span>
                Buscador Activo
              </div>
            </div>
            
            <label className="block text-xs uppercase tracking-wider font-bold text-text-platinum mb-2">Ubicación Objetivo</label>
            <div className="relative group/input">
              <input 
                className="glass-input w-full rounded-lg text-sm px-4 py-3 pl-10 placeholder-gray-500" 
                placeholder="Ej: Madrid, Barcelona..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-gray-500 group-focus-within/input:text-white transition-colors text-[20px]">location_on</span>
            </div>
          </div>
          
          <button 
            onClick={handleSearch}
            disabled={isSearching}
            className={`w-full flex items-center justify-center gap-2 bg-btn-primary hover:brightness-110 text-black font-bold py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm active:scale-[0.98] ${isSearching ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSearching ? (
               <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
               <span className="material-symbols-outlined text-[18px]">webhook</span>
            )}
            {isSearching ? 'Analizando...' : 'Buscar Leads'}
          </button>
        </div>
      </div>

      {/* Tracking Notes Form */}
      <div className="flex flex-col gap-4 flex-1">
        <h3 className="text-white text-lg font-semibold tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-white/50 text-[20px]">edit_note</span>
            Notas Rápidas
        </h3>
        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 h-full relative overflow-hidden">
          
          {!selectedLeadName && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6">
                  <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10">
                    <span className="material-symbols-outlined text-gray-400 text-2xl">touch_app</span>
                  </div>
                  <p className="text-gray-400 text-sm">Selecciona un cliente para habilitar la edición.</p>
              </div>
          )}

          {selectedLeadName && (
              <div className="bg-white/5 border border-white/10 p-3 rounded-lg text-xs text-white mb-1 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                  <span className="font-bold text-gray-400 uppercase tracking-wider">Cliente:</span> 
                  <span className="truncate flex-1">{selectedLeadName}</span>
              </div>
          )}

          <div className="grid grid-cols-2 gap-3">
              <label className="block">
                {/* Changed Label to Contacto as requested */}
                <span className="text-xs uppercase tracking-wider font-bold text-text-platinum mb-2 block">Contacto</span>
                <div className="relative group/select">
                  <select 
                    value={interactionType}
                    onChange={(e) => setInteractionType(e.target.value)}
                    className="glass-input w-full rounded-lg text-sm px-3 py-3 appearance-none cursor-pointer"
                  >
                    {INTERACTION_TYPES.map(type => (
                        <option key={type} value={type} className="bg-[#0f172a] text-white">{type}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wider font-bold text-text-platinum mb-2 block">Asignar a</span>
                <div className="relative group/select">
                  <select 
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="glass-input w-full rounded-lg text-sm px-3 py-3 appearance-none cursor-pointer"
                  >
                    {AGENTS.map(agent => (
                        <option key={agent} value={agent} className="bg-[#0f172a] text-white">{agent}</option>
                    ))}
                  </select>
                </div>
              </label>
          </div>

          <label className="block flex-1 flex flex-col">
            <span className="text-xs uppercase tracking-wider font-bold text-text-platinum mb-2 block">Detalle</span>
            <textarea 
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="glass-input w-full flex-1 rounded-lg text-sm px-4 py-3 resize-none min-h-[120px]" 
              placeholder="Escriba los detalles..."
            ></textarea>
          </label>
          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-all text-sm group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">save</span>
            Guardar en Notion
          </button>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;