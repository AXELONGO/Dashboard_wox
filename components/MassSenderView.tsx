import React, { useState } from 'react';

const MassSenderView: React.FC = () => {
    const [title, setTitle] = useState('');
    const [copy, setCopy] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    const handleSend = async (channel: 'email' | 'whatsapp') => {
        if (!title || !copy) {
            setStatus({ type: 'error', message: 'Por favor completa el Título y el Copy.' });
            return;
        }

        setLoading(true);
        setStatus({ type: null, message: '' });

        const webhookUrl = 'https://automatizaciones-n8n.tzudkj.easypanel.host/webhook/envios%20masivos';

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo: title,
                    copy: copy,
                    imagen: imageUrl,
                    canal: channel,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: `Envío masivo por ${channel === 'email' ? 'Correo' : 'WhatsApp'} iniciado correctamente.` });
                // Optional: Clear form
                // setTitle('');
                // setCopy('');
                // setImageUrl('');
            } else {
                throw new Error('Error en el servidor');
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Hubo un error al conectar con el servidor de envíos.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col min-w-0 bg-transparent relative z-0 h-full overflow-y-auto px-4 md:px-6 py-6 font-display">
            <div className="max-w-3xl mx-auto w-full">
                <div className="glass-panel p-6 md:p-8 rounded-2xl shadow-premium border border-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-white/10 text-blue-400">
                            <span className="material-symbols-outlined">campaign</span>
                        </span>
                        Envíos Masivos
                    </h2>
                    <p className="text-white mb-8 text-sm pl-[52px]">Configura y lanza campañas de comunicación masiva.</p>

                    <div className="space-y-6 relative z-10">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white uppercase tracking-wider ml-1">Título de la Campaña</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Oferta Especial de Verano"
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-base focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-600 focus:bg-black/50"
                            />
                        </div>

                        {/* Copy Textarea */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white uppercase tracking-wider ml-1">Copy / Mensaje</label>
                            <textarea
                                value={copy}
                                onChange={(e) => setCopy(e.target.value)}
                                placeholder="Escribe el contenido de tu mensaje aquí..."
                                rows={6}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-base focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-gray-600 focus:bg-black/50 resize-y min-h-[150px]"
                            />
                        </div>

                        {/* Image URL Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white uppercase tracking-wider ml-1">URL de Imagen (Opcional)</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-4 text-gray-500">image</span>
                                <input
                                    type="text"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-white text-base focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all placeholder:text-gray-600 focus:bg-black/50"
                                />
                            </div>
                        </div>

                        {/* Preview Image if valid URL */}
                        {imageUrl && (
                            <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 h-48 w-full flex items-center justify-center relative group/preview">
                                <img src={imageUrl} alt="Preview" className="h-full w-full object-cover opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                <span className="absolute text-xs text-white/50 bg-black/50 px-2 py-1 rounded bottom-2 right-2">Vista Previa</span>
                            </div>
                        )}

                        {/* Status Message */}
                        {status.message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                <span className="material-symbols-outlined">{status.type === 'error' ? 'error' : 'check_circle'}</span>
                                <span className="text-sm font-medium">{status.message}</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSend('email')}
                                disabled={loading}
                                className="group relative flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <span className="material-symbols-outlined group-hover:animate-bounce">mail</span>
                                <span>{loading ? 'Enviando...' : 'Enviar por Correo'}</span>
                                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"></div>
                            </button>

                            <button
                                onClick={() => handleSend('whatsapp')}
                                disabled={loading}
                                className="group relative flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/20 hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {/* WhatsApp Icon (Custom SVG or text equivalent if icon font missing) */}
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                <span>{loading ? 'Enviando...' : 'Enviar por WhatsApp'}</span>
                                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default MassSenderView;
