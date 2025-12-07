
import React from 'react';

interface HeaderProps {
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  activeTab: 'ventas' | 'cotizaciones';
  onTabChange: (tab: 'ventas' | 'cotizaciones') => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleLeftSidebar, onToggleRightSidebar, activeTab, onTabChange }) => {
  return (
    <header className="flex-none flex items-center justify-between whitespace-nowrap border-b border-glass-border bg-black/20 backdrop-blur-xl px-4 md:px-6 py-4 z-20">
      <div className="flex items-center gap-4 text-white">
        {/* Mobile Menu Button - Only show if in Sales View or generic */}
        {activeTab === 'ventas' && (
          <button
            onClick={onToggleLeftSidebar}
            className="lg:hidden text-gray-400 hover:text-white p-1 -ml-1 transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}

        <div className="size-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white shadow-inner">
          <span className="material-symbols-outlined text-[18px]">dataset</span>
        </div>
        <h2 className="text-white text-lg font-bold leading-tight tracking-wide text-glow hidden sm:block">DASHBOARD <span className="text-white/40 font-light">CON IA</span></h2>
      </div>

      <div className="flex flex-1 justify-end gap-4 md:gap-8 items-center">
        <nav className="flex items-center gap-4 lg:gap-8">
          <button
            onClick={() => onTabChange('ventas')}
            className={`text - sm font - medium leading - normal transition - all hover: text - glow px - 2 py - 1 relative ${activeTab === 'ventas' ? 'text-white' : 'text-gray-400 hover:text-white'} `}
          >
            Ventas
            {activeTab === 'ventas' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-glow rounded-full"></span>}
          </button>

          <button
            onClick={() => onTabChange('cotizaciones')}
            className={`text - sm font - medium leading - normal transition - all hover: text - glow px - 2 py - 1 relative ${activeTab === 'cotizaciones' ? 'text-white' : 'text-gray-400 hover:text-white'} `}
          >
            Cotizaciones
            {activeTab === 'cotizaciones' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-glow rounded-full"></span>}
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {/* Mobile History Button - Only for Sales View */}
          {activeTab === 'ventas' && (
            <button
              onClick={onToggleRightSidebar}
              className="lg:hidden text-gray-400 hover:text-white p-1 -mr-1 transition-colors"
            >
              <span className="material-symbols-outlined">history</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;