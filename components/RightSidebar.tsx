
import React from 'react';
import { HistoryItem } from '../types';

interface RightSidebarProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  leadName?: string;
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'call': return { icon: 'phone_in_talk', bg: 'bg-white/10', text: 'text-white', border: 'border-white/10' };
    case 'email': return { icon: 'mail', bg: 'bg-white/5', text: 'text-gray-300', border: 'border-white/5' };
    case 'note': return { icon: 'description', bg: 'bg-white/5', text: 'text-gray-400', border: 'border-white/5' };
    default: return { icon: 'info', bg: 'bg-white/5', text: 'text-gray-500', border: 'border-white/5' };
  }
};

const RightSidebar: React.FC<RightSidebarProps> = ({ history, isOpen, onClose, leadName }) => {
  const hasHistory = history.length > 0;

  return (
    <aside 
        className={`
            fixed inset-y-0 right-0 z-40 bg-black/60 backdrop-blur-2xl border-l border-glass-border flex flex-col overflow-y-auto transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1)
            w-[85%] sm:w-[320px] lg:static lg:translate-x-0 lg:flex
            ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}
        `}
    >
      <div className="p-6 border-b border-white/5 sticky top-0 bg-black/20 backdrop-blur-md z-10">
        <div className="flex justify-between items-center mb-4">
             <h3 className="text-white text-lg font-bold leading-tight text-glow">Historial</h3>
             <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1 transition-colors">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
        
        <div className="relative">
          {leadName ? (
              <div className="w-full glass-panel rounded-lg text-white text-xs px-4 py-3 font-bold truncate flex items-center gap-2 shadow-inner">
                  <span className="size-1.5 rounded-full bg-white shadow-glow"></span>
                  {leadName}
              </div>
          ) : (
            <div className="w-full bg-white/5 border border-white/5 rounded-lg text-gray-500 text-xs px-4 py-3 flex items-center justify-center opacity-70">
                <span className="material-symbols-outlined text-[16px] mr-2">public</span>
                <span>Actividad Global</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-5 flex flex-col gap-8">
        {!hasHistory && (
             <div className="text-center text-gray-600 py-12 flex flex-col items-center">
                 <span className="material-symbols-outlined text-3xl mb-2 opacity-20">history_toggle_off</span>
                 <p className="text-xs font-medium opacity-50">No hay actividad reciente.</p>
             </div>
        )}

        {hasHistory && (
            <div className="relative">
            {/* Main vertical line for timeline */}
            <div className="absolute left-[15px] top-2 bottom-4 w-px bg-gradient-to-b from-white/10 to-transparent"></div>
            
            {history.map((item, index) => {
                const styles = getIconForType(item.type);
                return (
                <div key={item.id} className="flex gap-4 mb-6 relative group">
                    <div className="flex-none relative z-10">
                        <div className={`${styles.bg} ${styles.text} rounded-full size-8 flex items-center justify-center border ${styles.border} shadow-lg group-hover:shadow-glow transition-shadow duration-300`}>
                            <span className="material-symbols-outlined text-[14px]">{styles.icon}</span>
                        </div>
                    </div>
                    <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start mb-1.5">
                            <span className="text-gray-200 font-semibold text-xs tracking-wide">{item.title}</span>
                            
                            <div className="flex items-center gap-2">
                                {/* Link al sitio web si existe */}
                                {item.clientWebsite && (
                                    <a 
                                        href={item.clientWebsite} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-gray-500 hover:text-blue-400 transition-colors flex items-center justify-center size-4 rounded hover:bg-white/5"
                                        title="Ir al sitio web"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                    </a>
                                )}
                                <span className="text-gray-600 text-[10px] whitespace-nowrap font-mono">{item.timestamp}</span>
                            </div>
                        </div>
                        
                        {/* AQUI SE AGREGA EL NOMBRE DE LA EMPRESA SIEMPRE, SIN CONDICION DE FILTRO */}
                        {item.clientName && item.clientName !== 'Cliente Desconocido' && (
                            <div className="mb-2 flex items-center">
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                    <span className="material-symbols-outlined text-[12px] text-blue-400">domain</span>
                                    <span className="text-[10px] font-bold text-blue-300 truncate max-w-[180px]">{item.clientName}</span>
                                </div>
                            </div>
                        )}

                        <div className="glass-panel p-3 rounded-lg border-white/5">
                            <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-wrap">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pl-1">
                            {item.user.avatarUrl ? (
                                <div 
                                    className="size-4 rounded-full bg-cover bg-center ring-1 ring-white/10" 
                                    style={{backgroundImage: `url("${item.user.avatarUrl}")`}}
                                ></div>
                            ) : (
                                <div className="size-4 rounded-full bg-white/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[10px] text-gray-400">person</span>
                                </div>
                            )}
                            <span className="text-gray-500 text-[10px] font-medium">{item.user.name}</span>
                            {item.isSynced && (
                                <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" className="w-2.5 h-2.5 grayscale opacity-30 ml-auto hover:opacity-100 transition-opacity" alt="synced" title="Desde Notion" />
                            )}
                        </div>
                    </div>
                </div>
                );
            })}
            </div>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
