
import React, { useState, useEffect } from 'react';
import { Quote, QuoteItem, Lead } from '../types';
import { generateQuotePDF } from '../services/pdfService';
import { addHistoryToNotionDatabase } from '../services/notionService';

const MOCK_HISTORY: Quote[] = [
    {
        id: '1',
        folio: 'QT-2023-001',
        date: '2023-10-24',
        company: 'Tech Solutions S.A.',
        contact: 'Carlos Ruiz',
        phone: '5512345678',
        email: 'carlos@tech.com',
        items: [],
        subtotal: 10732.76,
        iva: 1717.24,
        total: 12450.00,
        notes: 'Pago a 30 días',
        agent: 'Asesor 1'
    },
];

interface QuotesViewProps {
    leads: Lead[];
}

const QuotesView: React.FC<QuotesViewProps> = ({ leads }) => {
    // Form State
    const [company, setCompany] = useState('');
    const [contact, setContact] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [agent, setAgent] = useState('Asesor 1');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<QuoteItem[]>([
        { id: '1', quantity: 1, description: '', unitPrice: 0, amount: 0 }
    ]);

    // Totals State
    const [subtotal, setSubtotal] = useState(0);
    const [iva, setIva] = useState(0);
    const [retIsr, setRetIsr] = useState(0);
    const [total, setTotal] = useState(0);

    // History State
    const [history, setHistory] = useState<Quote[]>(MOCK_HISTORY);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate totals whenever items change
    useEffect(() => {
        const sub = items.reduce((sum, item) => sum + item.amount, 0);
        const tax = sub * 0.08; // IVA 8%
        const retention = sub * 0.0125; // Ret ISR 1.25%
        setSubtotal(sub);
        setIva(tax);
        setRetIsr(retention);
        setTotal(sub + tax - retention);
    }, [items]);

    const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // Recalculate amount dynamically using raw values parsed
                if (field === 'quantity' || field === 'unitPrice') {
                    const qty = field === 'quantity' ? (parseFloat(value) || 0) : (parseFloat(String(item.quantity)) || 0);
                    const price = field === 'unitPrice' ? (parseFloat(value) || 0) : (parseFloat(String(item.unitPrice)) || 0);
                    updated.amount = qty * price;
                }
                return updated;
            }
            return item;
        }));
    };

    const addItem = () => {
        const newItem: QuoteItem = {
            id: Date.now().toString(),
            quantity: 1,
            description: '',
            unitPrice: 0,
            amount: 0
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const createQuoteObject = (): Quote => {
        return {
            id: Date.now().toString(),
            folio: `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            date: new Date().toLocaleDateString('es-MX'),
            company,
            contact,
            phone,
            email,
            items,
            subtotal,
            iva,
            retIsr,
            total,
            notes,
            agent
        };
    };

    const resetForm = () => {
        setCompany('');
        setContact('');
        setPhone('');
        setEmail('');
        setNotes('');
        setItems([{ id: Date.now().toString(), quantity: 1, description: '', unitPrice: 0, amount: 0 }]);
    };

    const [isSending, setIsSending] = useState(false);

    const handleGeneratePDF = async () => {
        if (!company) return alert("Ingrese el nombre de la empresa");
        setIsProcessing(true);

        try {
            const newQuote = createQuoteObject();

            // 1. Generar PDF Localmente
            generateQuotePDF(newQuote);

            // 2. Guardar en Historial Local (UI)
            setHistory([newQuote, ...history]);

            // 3. Intentar guardar en Notion
            const matchedLead = leads.find(l => l.name.toLowerCase().trim() === company.toLowerCase().trim());

            if (matchedLead) {
                const noteText = `Cotización Generada #${newQuote.folio}\nTotal: $${newQuote.total.toLocaleString()}\nItems: ${newQuote.items.length}`;
                await addHistoryToNotionDatabase(matchedLead.id, noteText, agent, "Cotización");
            }

            // 4. Limpiar formulario
            resetForm();

            // Feedback visual más claro
            alert("✅ PDF Generado y guardado correctamente.");

        } catch (error: any) {
            console.error("Error generando PDF:", error);
            alert(`Hubo un error al generar el PDF: ${error.message || error}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendQuote = async () => {
        // DEBUG: Verificar si el click llega
        alert("DEBUG: Click recibido. Iniciando proceso...");

        if (!phone) {
            alert("⚠️ Por favor, ingrese un número de teléfono para enviar la cotización.");
            return;
        }

        // Confirmation Dialog
        const isConfirmed = window.confirm("¿Estás seguro de que deseas enviar esta cotización?");
        if (!isConfirmed) return;

        setIsSending(true);
        try {
            const newQuote = createQuoteObject();

            // Enviar al Webhook de n8n (vía Proxy)
            const webhookUrl = '/api/webhook';

            // Timeout para evitar que se quede colgado indefinidamente
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newQuote),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                alert("✅ Datos enviados correctamente al sistema.");
            } else {
                const errorText = await res.text();
                console.error("Error del servidor:", errorText);
                alert(`❌ Error al enviar los datos. El servidor respondió: ${res.status} ${res.statusText}`);
            }
        } catch (error: any) {
            console.error("Error de conexión:", error);
            if (error.name === 'AbortError') {
                alert("❌ El envío tardó demasiado. Verifique su conexión.");
            } else {
                alert(`❌ Error de conexión: ${error.message}. Verifique que el servidor acepte solicitudes (CORS).`);
            }
        } finally {
            setIsSending(false);
        }
    };

    // Styles for light inputs on dark background - Texto negro, fondo blanco
    const inputClass = "w-full rounded-lg py-3 px-4 text-sm bg-black/40 text-white border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all placeholder-gray-500 font-medium cursor-text";
    const labelClass = "text-xs font-bold text-white uppercase tracking-wide mb-1 block";

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8 animate-in fade-in duration-500 scroll-smooth pb-40">

            {/* SECTION: NEW QUOTE FORM */}
            <section className="fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-5">
                    <div className="size-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <span className="material-symbols-outlined text-blue-400 text-[20px]">add_circle</span>
                    </div>
                    <h2 className="text-xl font-bold text-white text-glow tracking-tight">Nueva Cotización</h2>
                </div>

                <div className="glass-panel p-6 md:p-8 rounded-2xl relative">
                    {/* Header Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                            <h3 className="text-white font-bold border-b border-white/10 pb-2">Datos del Cliente</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className={labelClass}>Empresa</label>
                                    <input
                                        type="text" placeholder="Nombre de la empresa"
                                        className={inputClass}
                                        value={company} onChange={e => setCompany(e.target.value)}
                                        list="leads-list" // Autocomplete
                                    />
                                    <datalist id="leads-list">
                                        {leads.map(l => <option key={l.id} value={l.name} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className={labelClass}>Contacto</label>
                                    <input
                                        type="text" placeholder="Nombre del contacto"
                                        className={inputClass}
                                        value={contact} onChange={e => setContact(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Teléfono</label>
                                        <input
                                            type="text" placeholder="55 1234 5678"
                                            className={inputClass}
                                            value={phone} onChange={e => setPhone(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Correo</label>
                                        <input
                                            type="email" placeholder="contacto@empresa.com"
                                            className={inputClass}
                                            value={email} onChange={e => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-white font-bold border-b border-white/10 pb-2">Detalles Generales</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Fecha</label>
                                        <input type="text" disabled value={new Date().toLocaleDateString()} className={`${inputClass} bg-white/5 text-gray-400 cursor-not-allowed`} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Folio (Auto)</label>
                                        <input type="text" disabled value="###" className={`${inputClass} bg-white/5 text-gray-400 cursor-not-allowed`} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Representante</label>
                                    <select
                                        className={inputClass}
                                        value={agent} onChange={e => setAgent(e.target.value)}
                                    >
                                        <option>Asesor 1</option>
                                        <option>Asesor 2</option>
                                        <option>Asesor 3</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="mb-6 overflow-x-auto bg-white/5 rounded-xl p-1 border border-white/10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-white uppercase border-b border-white/10">
                                    <th className="py-3 px-3 w-20 text-center">Cant</th>
                                    <th className="py-3 px-3">Descripción</th>
                                    <th className="py-3 px-3 w-36 text-right">P. Unitario</th>
                                    <th className="py-3 px-3 w-36 text-right">Importe</th>
                                    <th className="py-3 px-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b border-white/5 group hover:bg-white/5 transition-colors">
                                        <td className="py-2 px-2">
                                            <input
                                                type="number" min="1"
                                                className={`${inputClass} text-center font-bold`}
                                                value={item.quantity}
                                                onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input
                                                type="text"
                                                className={inputClass}
                                                placeholder="Descripción"
                                                value={item.description}
                                                onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-white text-xs font-bold z-10">$</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className={`${inputClass} text-right pl-6`}
                                                    value={item.unitPrice}
                                                    onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-right text-white font-mono font-bold">
                                            ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-white hover:text-red-400 transition-colors p-2 rounded hover:bg-white/10"
                                                title="Eliminar fila"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button
                            onClick={addItem}
                            className="m-2 text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors font-bold uppercase tracking-wide px-3 py-2 rounded hover:bg-blue-500/10"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span> Agregar Producto
                        </button>
                    </div>

                    {/* Totals & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className={labelClass}>Notas</label>
                            <textarea
                                className={`${inputClass} h-32 resize-none`}
                                placeholder="Condiciones de pago, tiempo de entrega, datos bancarios..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="space-y-4 bg-white/5 p-6 rounded-xl border border-white/5">
                            <div className="flex justify-between text-white text-sm">
                                <span>Subtotal</span>
                                <span className="font-mono text-white">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-gray-300 text-sm">
                                <span>Subtotal</span>
                                <span className="font-mono text-white">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-white text-sm">
                                <span>IVA (8%)</span>
                                <span className="font-mono text-white">${iva.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-white text-sm">
                                <span>Ret. ISR (1.25%)</span>
                                <span className="font-mono text-red-400">-${retIsr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-white text-xl font-bold border-t border-white/10 pt-4 mt-2">
                                <span>Total</span>
                                <span className="font-mono text-blue-400">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 border-t border-white/10 pt-6 relative z-[100]">
                        <button
                            type="button"
                            onClick={handleSendQuote}
                            className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-8 rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95 hover:scale-105 cursor-pointer relative z-[100]"
                        >
                            {isSending ? (
                                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-[24px]">send</span>
                            )}
                            <span className="text-lg">{isSending ? "Enviando..." : "Envio de Cotizacion"}</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* FLOATING ACTION BUTTON REMOVED TO CLEAR RIGHT SIDE */}
        </div>
    );
};

export default QuotesView;
