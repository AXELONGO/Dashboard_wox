
import React, { useState } from 'react';

interface DateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (startDate: string, endDate: string) => void;
}

const DateRangeModal: React.FC<DateRangeModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    if (!isOpen) return null;

    const handleGenerate = () => {
        if (!startDate || !endDate) {
            alert("Por favor selecciona ambas fechas.");
            return;
        }
        onGenerate(startDate, endDate);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h3 className="text-white text-lg font-bold mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                    Generar Reporte Diario
                </h3>
                <p className="text-gray-400 text-xs mb-6">Selecciona el rango de fechas para el reporte de vendedores.</p>

                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha Inicio</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha Fin</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm font-bold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="flex-1 py-3 bg-white text-black hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-white/10"
                    >
                        Generar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateRangeModal;
