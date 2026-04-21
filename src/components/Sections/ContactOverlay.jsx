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
            setIsTV(w > 1200 && w < 1600); // 1280px logical falls here
        };
        checkResolution();
        window.addEventListener('resize', checkResolution);
        return () => window.removeEventListener('resize', checkResolution);
    }, []);

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
        return () => setScrollLocked(false);
    }, [setScrollLocked, apiUrl]);

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

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const fullError = errorData ? `${errorData.error}: ${errorData.details || errorData.message || ''}` : 'AI Service Error';
                throw new Error(fullError);
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
        } catch (error) {
            console.error('------- AI ASSISTANT ERROR -------');
            setMessages(prev => [...prev, { role: 'assistant', content: `Извините, возникла ошибка при связи с ИИ. Но вы всё равно можете продолжить! Просто отправьте диалог менеджеру.` }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleRequestContact = () => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Почти готово! Укажите ваш Telegram (@nickname) для связи. Мы не собираем лишних данных.' }]);
        setContactMode(true);
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        if (!contactInput.trim() || isThinking) return;
        setIsThinking(true);
        try {
            await fetch(`${apiUrl}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages,
                    contact: contactInput
                })
            });
            
            setMessages(prev => [...prev, 
                { role: 'user', content: contactInput },
                { role: 'assistant', content: 'Заявка передана! Арт-директор свяжется с вами в Telegram в ближайшее время. Спасибо за интерес к КИМЭ!' }
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
           className={`relative md:fixed inset-0 w-full min-h-[100dvh] md:h-full pointer-events-auto flex flex-col ${isTV ? 'justify-start pt-[12vh]' : 'justify-center'} items-center px-4 md:px-0 z-[110] bg-black/80 backdrop-blur-md pb-12 transition-all duration-300`}
        >
            <div className="md:hidden absolute top-[99%] left-0 right-0 h-[50vh] bg-black/90 backdrop-blur-xl z-[-1]" />
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => navigate('/')} />
            
            <div 
                className={`relative z-10 w-full ${isMobile ? 'flex-1 max-h-none h-full' : 'w-[90vw] min-h-[400px] max-h-[85vh] h-fit'} flex flex-col transition-all duration-500 ease-in-out`}
                style={{ maxWidth: isTV ? '600px' : (isMobile ? 'none' : '1700px') }}
            >
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`shrink-0 text-center ${isTV ? 'mb-8' : 'mb-10 md:mb-16'} flex items-center justify-center w-full relative`}>
                    <div className="flex-grow text-center">
                        <h2 
                           className={`font-thin text-white uppercase tracking-[0.4em] leading-tight drop-shadow-2xl`}
                           style={{ fontSize: isTV ? '22px' : 'clamp(44px, 8vw, 110px)' }}
                        >
                            Нейро <span className="text-[#ffaa44] font-normal">Ассистент</span>
                        </h2>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} 
                    className="flex-1 min-h-[250px] relative w-full bg-[#0a0a0a]/95 backdrop-blur-3xl border-2 border-white/30 shadow-[0_40px_100px_rgba(0,0,0,1),inset_0_1px_2px_rgba(255,255,255,0.1)] rounded-[3rem] overflow-hidden flex flex-col"
                >
                    <div className={`flex-1 overflow-y-auto ${isTV ? 'px-8 py-6 space-y-6' : 'px-4 md:px-14 py-12 space-y-8'} no-scrollbar scroll-smooth overscroll-contain`}>
                        {messages.map((msg, idx) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className={`hidden md:flex ${isTV ? 'w-8 h-8 mr-4' : 'w-24 h-24 mr-12'} rounded-full bg-gradient-to-tr from-[#ffcc00]/20 to-transparent items-center justify-center shrink-0 border border-[#ffaa44]/40 mt-auto`}>
                                        <Sparkles size={isTV ? 14 : 48} className="text-[#ffaa44]" />
                                    </div>
                                )}
                                <div 
                                    className={`max-w-[95%] md:max-w-[85%] rounded-[3.5rem] border font-normal leading-relaxed shadow-lg ${
                                        msg.role === 'user' ? 'bg-[#ffaa44]/15 border-[#ffaa44]/50 text-[#ffaa44] rounded-br-[0.5rem]' : 'bg-white/10 border-white/20 text-gray-100 rounded-bl-[0.5rem]'
                                    }`}
                                    style={{ 
                                        padding: isTV ? '1rem 1.5rem' : (isMobile ? '2rem' : '3.5rem'),
                                        fontSize: isTV ? '13px' : 'clamp(18px, 2.5vw, 38px)'
                                    }}
                                >
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                        
                        {messages.length === 1 && !isThinking && (
                            <div className={`${isTV ? 'flex flex-col gap-3 mt-4 px-12' : 'flex flex-col gap-10 mt-20 md:grid md:grid-cols-2 md:gap-14 md:ml-32 md:mr-32 mb-14'}`}>
                                {QUICK_ACTIONS.map((act, i) => (
                                    <motion.button 
                                        key={act.id} 
                                        onClick={() => handleGptEstimate(null, act.prompt)} 
                                        className={`flex items-center justify-start ${isTV ? 'gap-3 p-3 rounded-[1.25rem]' : 'gap-12 md:gap-10 p-12 md:p-8 rounded-[3rem]'} bg-white/[0.07] border-2 border-white/30 hover:border-[#ffaa44] hover:bg-[#ffaa44]/20 transition-all duration-300 text-left w-full group shadow-2xl`}
                                    >
                                        <div className={`${isTV ? 'w-6 h-6' : 'w-24 w-24 md:w-20 md:h-20'} rounded-full bg-black flex items-center justify-center shrink-0 border-2 border-white/20 transition-all`}>
                                            {React.cloneElement(act.icon, { size: isTV ? 10 : 36 })}
                                        </div>
                                        <span className={`text-white font-black tracking-[0.1em] group-hover:text-[#ffaa44] uppercase ${isTV ? 'text-[10px]' : 'text-[18px] md:text-[clamp(16px,1.5vw,26px)]'}`}>{act.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {isThinking && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full justify-start mt-4">
                                <div className="hidden md:block w-4 h-4 shrink-0 mr-4 mt-auto"></div>
                                <div className="rounded-[1.25rem] p-3 bg-white/5 border border-white/10 text-gray-400 rounded-bl-[0.5rem] flex items-center gap-2 text-[10px] uppercase tracking-widest shadow-md">
                                    <Loader2 size={isTV ? 12 : 16} className="animate-spin text-[#ffaa44]" /> Генерирую...
                                </div>
                            </motion.div>
                        )}
                        <div ref={chatEndRef} className="h-4" />
                    </div>
                    
                    <div className={`${isTV ? 'p-4' : 'p-6 md:p-10'} border-t border-white/10 bg-[#050505]/60 shrink-0 relative z-20`}>
                        <AnimatePresence mode="wait">
                            {isSent ? (
                                <div className={`w-full flex items-center justify-center ${isTV ? 'gap-2 p-4' : 'gap-10 p-16'} bg-green-500/10 border border-green-500/30 rounded-2xl`}>
                                    <CheckCircle2 size={isTV ? 16 : 60} className="text-green-400" />
                                    <span 
                                        className={`text-green-300 font-medium`}
                                        style={{ fontSize: isTV ? '13px' : '40px' }}
                                    >
                                        Заявка успешно отправлена!
                                    </span>
                                </div>
                            ) : contactMode ? (
                                <form onSubmit={handleContactSubmit} className={`relative flex items-center ${isTV ? 'gap-2 px-6' : 'gap-12 md:gap-14'}`}>
                                    <input 
                                       type="text" value={contactInput} onChange={(e) => setContactInput(e.target.value)} placeholder="Telegram (например: @durov)" 
                                       className={`flex-1 w-full bg-black/60 border-2 border-[#ffaa44]/60 rounded-full text-white font-medium outline-none focus:border-[#ffaa44] transition-all`} 
                                       autoFocus 
                                       style={{ 
                                           padding: isTV ? '0.6rem 1.5rem' : (isMobile ? '2rem 3rem' : '2.5rem 4rem'),
                                           fontSize: isTV ? '13px' : '30px'
                                       }}
                                    />
                                    <button type="submit" className={`${isTV ? 'w-10 h-10' : 'w-24 h-24 md:w-20 md:h-20'} shrink-0 rounded-full bg-[#ffaa44] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all`}><Send size={isTV ? 14 : 32} /></button>
                                </form>
                            ) : (
                                <form onSubmit={(e) => handleGptEstimate(e)} className={`relative flex items-center ${isTV ? 'gap-2 px-6' : 'gap-12 md:gap-14'}`}>
                                    <input 
                                        type="text" value={gptInput} onChange={(e) => setGptInput(e.target.value)} placeholder="Опишите задачу подробнее..." 
                                        className={`flex-1 w-full bg-black/60 border-2 border-white/20 rounded-full text-white font-medium outline-none focus:border-[#ffaa44]/60 transition-all`} 
                                        style={{ 
                                            padding: isTV ? '0.6rem 1.5rem' : '2.5rem 4rem',
                                            fontSize: isTV ? '13px' : '30px'
                                        }}
                                    />
                                    <button type="submit" className={`${isTV ? 'w-10 h-10' : 'w-24 h-24 md:w-20 md:h-20'} shrink-0 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all`}><Send size={isTV ? 14 : 32} /></button>
                                </form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                <div className={`shrink-0 ${isTV ? 'mt-6 mb-2' : 'mt-16 mb-12'} flex flex-col items-center justify-center gap-2 relative z-10`}>
                    <div className={`flex flex-wrap items-center justify-center ${isTV ? 'gap-x-6 text-[10px]' : 'gap-x-14 text-[14px]'} tracking-[0.2em] uppercase font-black text-white/70`}>
                        <a href={`mailto:${globalContacts.email}`} className="hover:text-[#ffaa44] transition-colors">{globalContacts.email}</a>
                        <div className={`hidden md:block w-1 h-1 rounded-full bg-[#ffaa44]/40`} />
                        <a href={`https://t.me/${globalContacts.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:text-[#ffaa44] transition-colors">{globalContacts.telegram}</a>
                        <div className={`hidden md:block w-1 h-1 rounded-full bg-[#ffaa44]/40`} />
                        <a href={`tel:${globalContacts.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-[#ffaa44] transition-colors">{globalContacts.phone}</a>
                    </div>
                    <div className={`text-[9px] text-white/30 tracking-[0.3em] uppercase font-bold`}>© 2026 КИМЭ. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</div>
                </div>
           </div>
        </div>
    );
};

export default ContactOverlay;
