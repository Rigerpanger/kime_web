import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, MessageSquare, ArrowRight, DollarSign, Send, Loader2, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContactOverlay = () => {
    const navigate = useNavigate();
    const [focusedField, setFocusedField] = useState(null);
    const [mobileTab, setMobileTab] = useState('ai'); // 'ai' | 'form'
    
    // GPT State
    const [gptInput, setGptInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Опишите вашу идею, и я — нейросеть КИМЭ — рассчитаю примерную рыночную стоимость такого проекта.' }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    const [layout, setLayout] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const fetchLayout = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const res = await fetch(`${apiUrl}/content/global_layout`);
                if (res.ok) setLayout(await res.json());
            } catch (e) {
                console.error('Layout fetch error:', e);
            } finally {
                setIsReady(true);
            }
        };
        fetchLayout();

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getOff = (key) => layout?.[key] || 0;
    const hOff = isMobile ? getOff('contact_header_offset_mobile') : getOff('contact_header_offset_desktop');
    const cOff = isMobile ? getOff('contact_content_offset_mobile') : getOff('contact_content_offset_desktop');

    if (!isReady) return null;

    const handleGptEstimate = async (e) => {
        if (e) e.preventDefault();
        if (!gptInput.trim() || isThinking) return;

        const userText = gptInput.trim();
        const newMessages = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setGptInput('');
        setIsThinking(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: newMessages.map(msg => ({ role: msg.role, content: msg.content }))
                })
            });

            if (!response.ok) throw new Error('Proxy Server Error');

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
        } catch (error) {
            console.error('GPT Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Ой, связь с ИИ немного затянулась. Попробуйте еще раз или напишите нам напрямую!' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const inputClasses = (fieldName) => `
        w-full bg-black/40 border 
        ${focusedField === fieldName ? 'border-[#ffcc00] shadow-[0_0_15px_rgba(255,204,0,0.1)]' : 'border-white/10'} 
        rounded-lg px-3 py-1.5 text-white text-[12px] outline-none 
        focus:bg-black/60 transition-all duration-300
    `;

    // === AI Chat Panel Render ===
    const renderAiPanel = () => (
        <div className="flex flex-col h-full bg-black/20">
            <div className="p-3 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-[#ffcc00]/10 border border-[#ffcc00]/20 flex items-center justify-center text-[#ffcc00]">
                        <Sparkles size={10} />
                    </div>
                    <h2 className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/70">ОЦЕНЩИК</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-xl p-3 text-[11px] leading-relaxed border ${
                            msg.role === 'user' 
                                ? 'bg-[#ffcc00]/10 border-[#ffcc00]/20 text-[#ffcc00] rounded-tr-none' 
                                : 'bg-white/[0.03] border-white/5 text-gray-400 rounded-tl-none'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex w-full justify-start">
                        <div className="max-w-[85%] rounded-xl p-2 bg-white/[0.02] border border-white/5 text-gray-500 rounded-tl-none flex items-center gap-2 text-[7px] uppercase tracking-widest">
                            <Loader2 size={10} className="animate-spin text-[#ffcc00]" /> Думаю...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-white/5 bg-black/20 shrink-0">
                <form onSubmit={handleGptEstimate} className="relative">
                    <input 
                        type="text" 
                        value={gptInput}
                        onChange={(e) => setGptInput(e.target.value)}
                        disabled={isThinking}
                        placeholder="Опишите проект..." 
                        className="w-full bg-white/[0.02] border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-[13px] text-white outline-none focus:border-[#ffcc00]/40 transition-all placeholder:text-white/10"
                    />
                    <button 
                        type="submit" 
                        disabled={isThinking || !gptInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/20 hover:text-[#ffcc00] transition-colors disabled:opacity-20"
                    >
                        <Send size={12} />
                    </button>
                </form>
            </div>
        </div>
    );

    // === Request Form Panel Render ===
    const renderFormPanel = (showClose = false) => (
        <div className="flex flex-col p-4 md:p-5 h-full overflow-y-auto no-scrollbar">
            <div className="mb-3 relative flex justify-between items-start shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-1 rounded-full bg-[#ffcc00] shadow-[0_0_5px_#ffcc00]" />
                        <span className="text-[7px] uppercase tracking-[0.4em] font-bold text-[#ffcc00]/70">Заявка</span>
                    </div>
                    <h1 className="text-base md:text-lg font-thin text-white tracking-tight uppercase">Есть задача?</h1>
                </div>
                {showClose && (
                    <button onClick={() => navigate('/')} className="text-white/20 hover:text-white p-2 transition-colors">
                        <X size={16} />
                    </button>
                )}
            </div>

            <form className="space-y-2 flex-1" onSubmit={(e) => e.preventDefault()}>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ffcc00] transition-colors">
                        <User size={12} />
                    </div>
                    <input type="text" onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                        className={`${inputClasses('name')} pl-9`} placeholder="Ваше имя" />
                </div>

                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ffcc00] transition-colors">
                        <Mail size={12} />
                    </div>
                    <input type="text" onFocus={() => setFocusedField('contact')} onBlur={() => setFocusedField(null)}
                        className={`${inputClasses('contact')} pl-9`} placeholder="Telegram / Email" />
                </div>

                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ffcc00] transition-colors">
                        <DollarSign size={12} />
                    </div>
                    <input type="text" onFocus={() => setFocusedField('budget')} onBlur={() => setFocusedField(null)}
                        className={`${inputClasses('budget')} pl-9`} placeholder="Бюджет" />
                </div>

                <div className="relative group">
                    <div className="absolute left-3 top-3 text-white/20 group-focus-within:text-[#ffcc00] transition-colors">
                        <MessageSquare size={12} />
                    </div>
                    <textarea rows="2" onFocus={() => setFocusedField('message')} onBlur={() => setFocusedField(null)}
                        className={`${inputClasses('message')} pl-9 resize-none pt-2.5`} placeholder="О проекте..." />
                </div>

                <div className="pt-2">
                    <button className="w-full group relative overflow-hidden bg-[#ffcc00] text-black py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-500 hover:bg-[#ffaa00] hover:shadow-[0_10px_25px_rgba(255,204,0,0.15)] outline-none">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Отправить</span>
                        <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="w-full h-[100dvh] md:min-h-screen pointer-events-auto flex flex-col justify-center items-center px-4 py-6 md:py-12 relative z-50 bg-black/10">
            
            {/* Close Overlay */}
            <div className="absolute inset-0 z-0 hidden md:block cursor-pointer" onClick={() => navigate('/')} />

            <div className="relative z-10 w-full max-w-3xl flex flex-col items-center max-h-full">
                
                {/* Visual Header */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ transform: `translateY(${hOff}px)` }}
                    className="text-center mb-4 md:mb-5 shrink-0"
                >
                    <h2 className="text-lg md:text-2xl font-thin text-white uppercase tracking-[0.4em] leading-tight transition-all">
                        Оценить <span className="text-[#ffaa44] font-normal">проект</span>
                    </h2>
                </motion.div>

                {/* Main Modal - Ultra Premium Glass */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ transform: `translateY(${cOff}px)` }}
                    className="relative w-full bg-[#080808]/40 backdrop-blur-3xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden transform flex flex-col max-h-[70vh] md:max-h-none"
                >
                    
                    {/* DESKTOP VIEW */}
                    <div className="hidden md:flex flex-row h-[324px] shrink-0">
                        <div className="w-1/2 flex flex-col border-r border-white/5">
                            {renderAiPanel()}
                        </div>
                        <div className="w-1/2 flex flex-col">
                            {renderFormPanel(false)}
                        </div>
                    </div>

                    {/* MOBILE VIEW */}
                    <div className="md:hidden flex flex-col h-full">
                        <div className="flex border-b border-white/5 shrink-0 bg-black/20">
                            <button onClick={() => setMobileTab('ai')}
                                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 outline-none ${
                                    mobileTab === 'ai' ? 'text-[#ffcc00] bg-white/[0.03]' : 'text-white/30 hover:text-white/60'
                                }`}>
                                <Sparkles size={14} /> ИИ
                            </button>
                            <button onClick={() => setMobileTab('form')}
                                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 outline-none ${
                                    mobileTab === 'form' ? 'text-[#ffcc00] bg-white/[0.03]' : 'text-white/30 hover:text-white/60'
                                }`}>
                                <Mail size={14} /> Форма
                            </button>
                        </div>
                        <div className="flex-grow overflow-hidden">
                            {mobileTab === 'ai' ? renderAiPanel() : renderFormPanel()}
                        </div>
                    </div>
                </motion.div>

                {/* Footer Signature */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ transform: `translateY(${cOff}px)` }}
                    className="mt-8 md:mt-8 flex flex-col items-center"
                >
                    <div className="flex flex-col md:flex-row items-center justify-center gap-x-16 gap-y-4 text-[10px] tracking-[0.4em] uppercase font-bold text-white/20">
                        <a href="mailto:hello@kime.xyz" className="hover:text-[#ffaa44] transition-all">hello@kime.xyz</a>
                        <div className="hidden md:block w-1 h-1 rounded-full bg-white/10" />
                        <a href="https://t.me/kimeprod" target="_blank" rel="noreferrer" className="hover:text-[#ffaa44] transition-all">Telegram</a>
                        <div className="hidden md:block w-1 h-1 rounded-full bg-white/10" />
                        <a href="tel:+79990000000" className="hover:text-[#ffaa44] transition-all">+7 (999) 000-00-00</a>
                    </div>
                    <div className="mt-4 text-[8px] text-white/5 tracking-[0.6em] uppercase font-bold">
                        &copy; {new Date().getFullYear()} Kime Studio &bull; Moscow
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ContactOverlay;
