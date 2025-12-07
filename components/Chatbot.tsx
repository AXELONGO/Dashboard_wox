
import React, { useState } from 'react';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {/* Chat Window */}
            <div className={`
                transition-all duration-300 origin-bottom-right
                ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'}
            `}>
                <div className="w-[350px] h-[500px] glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/10 bg-[#0f172a]/90 backdrop-blur-xl">

                    <iframe
                        src="https://automatizaciones-n8n.tzudkj.easypanel.host/webhook/5206e527-afb0-4994-a691-f881bbf7c5e8/chat"
                        className="flex-1 w-full border-none bg-transparent"
                        title="Chatbot"
                    />
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    size-14 rounded-full shadow-glow flex items-center justify-center transition-all duration-300
                    ${isOpen ? 'bg-red-500/80 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500 hover:scale-110'}
                    text-white border border-white/20
                `}
            >
                <span className={`material-symbols-outlined text-[28px] transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                    {isOpen ? 'close' : 'smart_toy'}
                </span>
            </button>
        </div>
    );
};

export default Chatbot;
