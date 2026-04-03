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
        { role: 'assistant', content: 'Привет! Я Нейро-Ассистент студии КИМЭ. Готов помочь вам с проектом. Выберите с чего начнем, или просто напишите мне.' }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const [contactMode, setContactMode] = useState(false);
    const [contactInput, setContactInput] = useState('');
    const [isSent, setIsSent] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    useEffect(() => {
        return () => setScrollLocked(false);
    }, [setScrollLocked]);

    const QUICK_ACTIONS = [
        { id: 'tz', icon: <MessageSquare size={16} className="text-[#ffaa44]" />, label: 'Сформировать ТЗ', prompt: 'Я хочу сформировать подробное ТЗ (техническое задание) для моего проекта. Начни задавать мне вопросы по одному, чтобы мы собрали всю нужную информацию.' },
        { id: 'price', icon: <DollarSign size={16} className="text-[#ffaa44]" />, label: 'Узнать стоимость', prompt: 'Я хочу узнать примерную стоимость разработки. Какие вводные данные тебе нужны для оценки?' },
        { id: 'fast', icon: <ArrowRight size={16} className="text-[#ffaa44]" />, label: 'Быстрая заявка', prompt: 'Я хочу сразу передать контакты менеджеру для связи.' }
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
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map(msg => ({ role: msg.role, content: msg.content }))
                })
            });

            if (!response.ok) throw new Error('Proxy Server Error');

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
        } catch (error) {
            console.error('GPT Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Ой, связь с ИИ немного затянулась. Но мы всё равно можем продолжить! Просто отправьте диалог менеджеру.' }]);
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
        setTimeout(() => {
            setMessages(prev => [...prev, 
                { role: 'user', content: contactInput },
                { role: 'assistant', content: 'Заявка передана! Арт-директор свяжется с вами в Telegram в ближайшее время. Спасибо за интерес к КИМЭ!' }
            ]);
            setIsSent(true);
            setContactMode(false);
            setIsThinking(false);
        }, 1200);
    };

    return (
        <div className="absolute md:fixed inset-0 pointer-events-auto flex flex-col justify-center items-center px-4 md:px-0 z-[90] bg-black/80 backdrop-blur-md pt-[100px] md:pt-[120px] pb-4 md:pb-8">
            
            {/* Close Overlay */}
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => navigate('/')} />

            {/* Bulletproof Boundary Container */}
            <div className="relative z-10 w-full md:w-[75vw] max-w-[800px] h-full max-h-[850px] flex flex-col justify-center">
                
                {/* Visual Header (Outside) */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="shrink-0 text-center mb-4 md:mb-6 flex items-center justify-center w-full relative"
                >
                    <div className="flex-grow text-center">
                        <h2 className="text-xl md:text-3xl font-thin text-white uppercase tracking-[0.4em] leading-tight drop-shadow-2xl">
                            Нейро <span className="text-[#ffaa44] font-normal">Ассистент</span>
                        </h2>
                    </div>
                    <button onClick={() => navigate('/')} className="absolute right-0 text-white/60 hover:text-white transition-all bg-white/10 p-2 md:p-2.5 rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95 shadow-xl md:translate-x-4">
                        <X size={20} />
                    </button>
                </motion.div>

                {/* Main Modal - Flex Shrinking Box */}
                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    onMouseEnter={() => setScrollLocked(true)}
                    onMouseLeave={() => setScrollLocked(false)}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    className="flex-1 min-h-[300px] relative w-full bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)] rounded-[2rem] overflow-hidden flex flex-col"
                >
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4 no-scrollbar scroll-smooth">
                        {messages.map((msg, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={idx} 
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="hidden md:flex w-7 h-7 rounded-full bg-gradient-to-tr from-[#ffcc00]/20 to-transparent items-center justify-center shrink-0 border border-[#ffaa44]/40 mr-3 mt-auto shadow-[0_0_15px_rgba(255,170,68,0.2)]">
                                        <Sparkles size={12} className="text-[#ffaa44]" />
                                    </div>
                                )}
                                <div className={`max-w-[92%] md:max-w-[80%] rounded-[1.25rem] p-3.5 md:p-3 text-[13px] md:text-[12px] leading-relaxed shadow-lg border ${
                                    msg.role === 'user' 
                                        ? 'bg-[#ffaa44]/10 border-[#ffaa44]/30 text-[#ffaa44] rounded-br-[0.5rem] md:rounded-br-sm' 
                                        : 'bg-white/5 border-white/10 text-gray-200 rounded-bl-[0.5rem] md:rounded-bl-sm'
                                }`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}

                        {/* Quick Actions Array */}
                        {messages.length === 1 && !isThinking && (
                            <div className="flex flex-col gap-2.5 mt-2 md:grid md:grid-cols-2 md:gap-3 md:ml-10 md:mr-10">
                                {QUICK_ACTIONS.map((act, i) => (
                                    <motion.button 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={act.id} 
                                        onClick={() => handleGptEstimate(null, act.prompt)} 
                                        className="flex items-center justify-start gap-3 bg-white/5 border border-white/20 hover:border-[#ffaa44]/60 hover:bg-[#ffaa44]/15 hover:translate-y-[-2px] transition-all duration-300 rounded-[1rem] p-3 md:p-2.5 text-left w-full outline-none group shadow-sm hover:shadow-lg"
                                    >
                                        <div className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-black/80 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 group-hover:bg-black transition-all duration-300 shadow-md">
                                            {React.cloneElement(act.icon, { size: 14, className: "text-[#ffaa44]" })}
                                        </div>
                                        <span className="text-white font-medium tracking-wide group-hover:text-[#ffaa44] text-[12px] md:text-[10px] uppercase transition-colors">{act.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {isThinking && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full justify-start mt-4">
                                <div className="hidden md:block w-8 h-8 shrink-0 mr-4 mt-auto"></div>
                                <div className="rounded-[1.25rem] p-3.5 bg-white/5 border border-white/10 text-gray-400 rounded-bl-[0.5rem] flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest shadow-md">
                                    <Loader2 size={14} className="animate-spin text-[#ffaa44]" /> Генерирую...
                                </div>
                            </motion.div>
                        )}
                        <div ref={chatEndRef} className="h-4" />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 md:p-3 border-t border-white/10 bg-[#050505]/60 shrink-0 relative z-20">
                        <AnimatePresence>
                            {!isSent && !contactMode && messages.length > 2 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 10, height: 0 }}
                                    className="flex justify-end mb-2.5 overflow-hidden"
                                >
                                    <button 
                                        onClick={handleRequestContact}
                                        className="bg-gradient-to-r from-[#ffaa44] to-[#ffcc00] text-black px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[10px] md:text-[10px] uppercase tracking-[0.2em] font-black hover:shadow-[0_0_20px_rgba(255,170,68,0.5)] hover:bg-white hover:scale-[1.02] transition-all flex items-center gap-2"
                                    >
                                        Отправить диалог менеджеру <ArrowRight size={14} strokeWidth={3} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            {isSent ? (
                                <motion.div 
                                    key="sent"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full flex items-center justify-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-2xl md:rounded-2xl shadow-sm"
                                >
                                    <CheckCircle2 size={16} className="text-green-400" />
                                    <span className="text-green-300 font-medium text-[12px] md:text-[13px]">Заявка успешно отправлена!</span>
                                </motion.div>
                            ) : contactMode ? (
                                <motion.form 
                                    key="contact"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleContactSubmit} 
                                    className="relative flex items-center gap-2 md:gap-3"
                                >
                                    <input 
                                        type="text" 
                                        value={contactInput}
                                        onChange={(e) => setContactInput(e.target.value)}
                                        disabled={isThinking}
                                        placeholder="Telegram (например: @durov)" 
                                        className="flex-1 w-full bg-black/40 border border-[#ffaa44]/50 focus:border-[#ffaa44] shadow-[0_0_15px_rgba(255,170,68,0.15)] rounded-full px-5 py-3 text-[13px] md:text-sm text-white outline-none transition-all placeholder:text-white/40 font-medium"
                                        autoFocus
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isThinking || !contactInput.trim()}
                                        className="w-12 h-12 md:w-11 md:h-11 shrink-0 rounded-full bg-[#ffaa44] hover:bg-white text-black flex items-center justify-center transition-all disabled:opacity-50 shadow-md"
                                    >
                                        {isThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                </motion.form>
                            ) : (
                                <motion.form 
                                    key="ai"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={(e) => handleGptEstimate(e)} 
                                    className="relative flex items-center gap-2 md:gap-3"
                                >
                                    <input 
                                        type="text" 
                                        value={gptInput}
                                        onChange={(e) => setGptInput(e.target.value)}
                                        disabled={isThinking}
                                        placeholder="Опишите задачу подробнее..." 
                                        className="flex-1 w-full bg-black/40 border border-white/20 rounded-full px-5 py-3 md:py-3 text-[13px] md:text-[13px] text-white outline-none focus:border-white/40 focus:bg-white/5 transition-all placeholder:text-white/30 font-light shadow-inner"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={isThinking || !gptInput.trim()}
                                        className="w-12 h-12 md:w-11 md:h-11 shrink-0 rounded-full bg-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all disabled:opacity-20 border border-white/20 shadow-sm"
                                    >
                                        <Send size={16} />
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Footer Links Below Modal */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="shrink-0 mt-5 md:mt-6 flex flex-wrap items-center justify-center gap-x-6 md:gap-x-8 gap-y-2 text-[9px] md:text-[11px] tracking-widest uppercase font-bold text-white/40 mb-2"
                >
                    <a href="mailto:hello@kime.xyz" className="hover:text-[#ffaa44] transition-all drop-shadow-md">hello@kime.xyz</a>
                    <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20" />
                    <a href="https://t.me/kimeprod" target="_blank" rel="noreferrer" className="hover:text-[#ffaa44] transition-all drop-shadow-md">Telegram</a>
                    <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20" />
                    <a href="tel:+79990000000" className="hover:text-[#ffaa44] transition-all drop-shadow-md">+7 (999) 000-00-00</a>
                </motion.div>
            </div>
        </div>
    );
};

export default ContactOverlay;
