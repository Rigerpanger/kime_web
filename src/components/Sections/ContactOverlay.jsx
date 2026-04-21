import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MessageSquare, ArrowRight, DollarSign, Send, Loader2, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

const ContactOverlay = () => {
    const navigate = useNavigate();
    const setScrollLocked = useAppStore(s => s.setScrollLocked);
    
    const [gptInput, setGptInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Здравствуйте. Я — Интеллектуальный Эксперт студии KIME. Готов провести технический аудит вашего проекта и рассчитать профессиональную смету. С чего начнем?' }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const [contactMode, setContactMode] = useState(false);
    const [contactInput, setContactInput] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [globalContacts, setGlobalContacts] = useState({
        telegram: '@Richardsan',
        email: 'rp@kimeproduction.ru',
        phone: '+7 (999) 000-00-00'
    });
    
    const [isTV, setIsTV] = useState(false);
    
    useEffect(() => {
        const checkResolution = () => {
            const w = window.innerWidth;
            setIsTV(w > 1000 && w < 1600); 
        };
        checkResolution();
        window.addEventListener('resize', checkResolution);
        return () => {
            window.removeEventListener('resize', checkResolution);
            setScrollLocked(false);
        };
    }, [setScrollLocked]);

    const chatEndRef = useRef(null);
    const apiUrl = import.meta.env.VITE_API_URL || '/api';

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 1 || isThinking) {
            scrollToBottom();
        }
    }, [messages, isThinking]);

    useEffect(() => {
        const fetchGlobalContacts = async () => {
            try {
                const res = await fetch(`${apiUrl}/content/global_layout`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.telegram || data.email || data.phone) {
                        setGlobalContacts(prev => ({
                            ...prev,
                            telegram: data.telegram || prev.telegram,
                            email: data.email || prev.email,
                            phone: data.phone || prev.phone
                        }));
                    }
                }
            } catch (e) { console.error('Failed to fetch contacts:', e); }
        };
        fetchGlobalContacts();
    }, [apiUrl]);

    const QUICK_ACTIONS = [
        { id: 'tz', icon: <MessageSquare className="text-[#ffaa44]" />, label: 'Техническое ТЗ', prompt: 'Необходимо подготовить техническое задание. Проведи опрос по пунктам.' },
        { id: 'price', icon: <DollarSign className="text-[#ffaa44]" />, label: 'Рыночная оценка', prompt: 'Какая ориентировочная стоимость разработки? Подготовь оценку.' },
        { id: 'fast', icon: <ArrowRight className="text-[#ffaa44]" />, label: 'Связь с командой', prompt: 'Передай мои контакты менеджеру прямо сейчас.' }
    ];

    const handleGptEstimate = async (e, directText = null) => {
        if (e) e.preventDefault();
        const textToUse = directText || gptInput;
        if (!textToUse.trim() || isThinking) return;

        if (textToUse.trim() === QUICK_ACTIONS[2].prompt) {
            setMessages(prev => [...prev, 
                { role: 'user', content: textToUse },
                { role: 'assistant', content: 'Отлично! Оставьте ваш Telegram (например, @nickname) и я передам заявку команде КИМЭ.' }
            ]);
            if (!directText) setGptInput('');
            setContactMode(true);
            return;
        }

        const newMessages = [...messages, { role: 'user', content: textToUse }];
        setMessages(newMessages);
        if (!directText) setGptInput('');
        setIsThinking(true);

        try {
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(msg => ({ role: msg.role, content: msg.content }))
                })
            });

            if (!response.ok) throw new Error('AI Service Error');

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
        } catch (error) {
            console.error('------- AI ASSISTANT ERROR -------');
            setMessages(prev => [...prev, { role: 'assistant', content: `Извините, возникла ошибка при связи с ИИ. Но вы всё равно можете продолжить!` }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        if (!contactInput.trim() || isThinking) return;
        setIsThinking(true);
        try {
            await fetch(`${apiUrl}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messages, contact: contactInput })
            });
            
            setMessages(prev => [...prev, 
                { role: 'user', content: contactInput },
                { role: 'assistant', content: 'Заявка передана! Арт-директор свяжется с вами в Telegram. Спасибо!' }
            ]);
            setIsSent(true);
            setContactMode(false);
        } catch (error) {
            console.error('❌ Notification Error:', error);
        } finally {
            setIsThinking(false);
        }
    };

    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

    return (
        <div 
            className={`relative md:fixed inset-0 w-full min-h-[100dvh] md:h-full pointer-events-auto flex flex-col ${isTV ? 'justify-start pt-[15vh]' : (isMobile ? 'justify-start pt-[5vh]' : 'justify-center')} items-center px-4 md:px-0 z-[110] bg-black/80 backdrop-blur-md pb-12 transition-all duration-300`}
        >
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => navigate('/')} />
            
            <div 
                className={`relative z-10 w-full ${isMobile ? 'flex-1 max-h-none h-full' : 'w-[95vw] min-h-[400px] max-h-[85vh] h-fit'} flex flex-col transition-all duration-500 ease-in-out`}
                style={{ maxWidth: isTV ? '520px' : (isMobile ? 'none' : '1200px') }}
            >
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`shrink-0 text-center ${isTV ? 'mb-4' : 'mb-8 md:mb-14'} flex items-center justify-center w-full relative`}>
                    <h2 className="font-thin text-white uppercase tracking-[0.4em] leading-tight" style={{ fontSize: (isMobile || isTV) ? '16px' : '32px' }}>
                        Нейро <span className="text-[#ffaa44] font-normal">Ассистент</span>
                    </h2>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.98 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    className="flex-1 min-h-[250px] relative w-full bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 shadow-2xl rounded-[2rem] md:rounded-[3rem] overflow-hidden flex flex-col"
                    onMouseEnter={() => !isMobile && setScrollLocked(true)}
                    onMouseLeave={() => !isMobile && setScrollLocked(false)}
                >
                    <div 
                        onWheel={(e) => e.stopPropagation()}
                        className={`flex-1 overflow-y-auto ${(isMobile || isTV) ? 'px-4 py-6 space-y-4' : 'px-8 py-10 space-y-6'} no-scrollbar scroll-smooth overscroll-contain`}
                    >
                        {messages.map((msg, idx) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div 
                                    className={`max-w-[90%] rounded-[1.2rem] md:rounded-[2.5rem] border font-normal leading-relaxed ${
                                        msg.role === 'user' ? 'bg-[#ffaa44]/10 border-[#ffaa44]/30 text-[#ffaa44] rounded-br-none' : 'bg-white/5 border-white/10 text-gray-200 rounded-bl-none'
                                    }`}
                                    style={{ 
                                        padding: (isMobile || isTV) ? '0.6rem 1rem' : '1.2rem 2rem',
                                        fontSize: (isMobile || isTV) ? '13px' : '18px'
                                    }}
                                >
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                                                {messages.length === 1 && !isThinking && (
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mt-6 mb-4 md:px-10`}>
                                {QUICK_ACTIONS.map((act) => (
                                    <motion.button 
                                        key={act.id} 
                                        onClick={() => handleGptEstimate(null, act.prompt)} 
                                        className="flex items-center gap-3 md:gap-5 p-3 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 hover:border-[#ffaa44]/50 hover:bg-[#ffaa44]/5 transition-all text-left group"
                                    >
                                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-black flex items-center justify-center shrink-0 border border-white/10">
                                            {React.cloneElement(act.icon, { size: (isMobile || isTV) ? 14 : 22 })}
                                        </div>
                                        <span className="text-white font-bold tracking-wider uppercase text-[10px] md:text-[14px] group-hover:text-[#ffaa44]">{act.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                        
                        {isThinking && (
                            <div className="flex gap-2 items-center text-[10px] text-white/40 uppercase tracking-widest pl-2">
                                <Loader2 size={12} className="animate-spin" /> Думаю...
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    
                    <div className="p-3 md:p-6 border-t border-white/10 bg-black/40">
                        <AnimatePresence mode="wait">
                            {isSent ? (
                                <div className="w-full py-4 text-center text-green-400 font-medium text-sm md:text-lg flex items-center justify-center gap-3">
                                    <CheckCircle2 size={20} /> Заявка отправлена!
                                </div>
                            ) : contactMode ? (
                                <form onSubmit={handleContactSubmit} className="flex gap-2 items-center">
                                    <input 
                                        type="text" value={contactInput} onChange={(e) => setContactInput(e.target.value)} 
                                        placeholder="Telegram @nickname" autoFocus
                                        className="flex-1 bg-white/5 border border-[#ffaa44]/50 rounded-full px-4 py-2 text-white outline-none text-sm md:text-base" 
                                    />
                                    <button type="submit" className="w-10 h-10 rounded-full bg-[#ffaa44] text-black flex items-center justify-center transition-transform hover:scale-105"><Send size={16} /></button>
                                </form>
                            ) : (
                                <form onSubmit={(e) => handleGptEstimate(e)} className="flex gap-2 md:gap-4 items-center px-2 md:px-10">
                                    <input 
                                        type="text" value={gptInput} onChange={(e) => setGptInput(e.target.value)} 
                                        placeholder="Опишите задачу..." 
                                        className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 md:py-4 text-white outline-none text-sm md:text-xl focus:border-white/30" 
                                    />
                                    <button type="submit" className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all"><Send size={(isMobile || isTV) ? 16 : 24} /></button>
                                </form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                <div className="mt-6 md:mt-8 flex flex-col items-center gap-3 w-full opacity-60">
                    <div className="flex flex-col md:flex-row items-center gap-3 md:gap-8 text-[11px] md:text-[12px] uppercase font-bold tracking-widest text-white/80">
                        <a href={`mailto:${globalContacts.email}`} className="hover:text-[#ffaa44]">{globalContacts.email}</a>
                        <a href={`https://t.me/${globalContacts.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:text-[#ffaa44]">{globalContacts.telegram}</a>
                        <a href={`tel:${globalContacts.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-[#ffaa44]">{globalContacts.phone}</a>
                    </div>
                </div>
           </div>
        </div>
    );
};

export default ContactOverlay;
