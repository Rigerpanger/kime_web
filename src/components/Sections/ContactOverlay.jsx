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
        { role: 'assistant', content: 'Здравствуйте. Я — Elite Creative Estimator студии KIME. Готов провести техническую квалификацию вашего проекта и рассчитать рыночную вилку цен. С чего начнем?' }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const [contactMode, setContactMode] = useState(false);
    const [contactInput, setContactInput] = useState('');
    const [isSent, setIsSent] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 1 || isThinking) {
            scrollToBottom();
        }
    }, [messages, isThinking]);

    useEffect(() => {
        setScrollLocked(true);
        return () => setScrollLocked(false);
    }, [setScrollLocked]);

    const QUICK_ACTIONS = [
        { id: 'tz', icon: <MessageSquare size={16} className="text-[#ffaa44]" />, label: 'Техническое ТЗ', prompt: 'Необходимо подготовить техническое задание. Проведи опрос по пунктам.' },
        { id: 'price', icon: <DollarSign size={16} className="text-[#ffaa44]" />, label: 'Рыночная оценка', prompt: 'Какая ориентировочная стоимость разработки? Подготовь оценку.' },
        { id: 'fast', icon: <ArrowRight size={16} className="text-[#ffaa44]" />, label: 'Связь с командой', prompt: 'Передай мои контакты менеджеру прямо сейчас.' }
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

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const fullError = errorData ? `${errorData.error}: ${errorData.details || errorData.message || ''}` : 'AI Service Error';
                throw new Error(fullError);
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
        } catch (error) {
            console.error('------- AI ASSISTANT ERROR -------');
            console.error(error);
            console.error('----------------------------------');
            
            let errorMessage = 'Ой, связь с ИИ немного затянулась. ';
            if (error.message.includes('SERVER_CONFIG_ERROR')) errorMessage += 'Ошибка: Ключ API не найден на сервере.';
            else if (error.message.includes('UPSTREAM_API_ERROR')) errorMessage += 'Ошибка: Прокси-сервер отклонил запрос (проверьте ключ).';
            else if (error.message.includes('AI request timed out')) errorMessage += 'Ошибка: Время ожидания истекло.';
            else errorMessage += `Техническая ошибка: ${error.message}`;

            setMessages(prev => [...prev, { role: 'assistant', content: `${errorMessage} Но мы всё равно можем продолжить! Просто отправьте диалог менеджеру.` }]);
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
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
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
            // Even if notification fails, show success to user but log it
            setMessages(prev => [...prev, { role: 'assistant', content: 'Система уведомлений немного перегружена, но мы увидим вашу заявку. Спасибо!' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const preventScrollLeaking = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="fixed inset-0 pointer-events-auto flex flex-col justify-center items-center px-4 md:px-0 z-[110] bg-black/80 backdrop-blur-md pt-20 md:pt-28 pb-4">
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => navigate('/')} />
            <div className="relative z-10 w-full md:w-[75vw] max-w-[800px] h-full max-h-[850px] flex flex-col justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="shrink-0 text-center mb-4 md:mb-6 flex items-center justify-center w-full relative">
                    <div className="flex-grow text-center">
                        <h2 className="text-xl md:text-3xl font-thin text-white uppercase tracking-[0.4em] leading-tight drop-shadow-2xl">
                            Нейро <span className="text-[#ffaa44] font-normal">Ассистент</span>
                        </h2>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex-1 min-h-[300px] relative w-full bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/15 shadow-[0_30px_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)] rounded-[2rem] overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4 no-scrollbar scroll-smooth">
                        {messages.map((msg, idx) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="hidden md:flex w-6 h-6 rounded-full bg-gradient-to-tr from-[#ffcc00]/20 to-transparent items-center justify-center shrink-0 border border-[#ffaa44]/40 mr-2.5 mt-auto">
                                        <Sparkles size={10} className="text-[#ffaa44]" />
                                    </div>
                                )}
                                <div className={`max-w-[92%] md:max-w-[80%] rounded-[1.25rem] p-3.5 md:p-2.5 text-[13px] md:text-[11px] leading-relaxed shadow-lg border ${
                                    msg.role === 'user' ? 'bg-[#ffaa44]/10 border-[#ffaa44]/30 text-[#ffaa44] rounded-br-[0.5rem]' : 'bg-white/5 border-white/10 text-gray-200 rounded-bl-[0.5rem]'
                                }`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                        
                        {/* Восстановленные Кнопки Быстрых Действий */}
                        {messages.length === 1 && !isThinking && (
                            <div className="flex flex-col gap-2.5 mt-2 md:grid md:grid-cols-2 md:gap-2 md:ml-8 md:mr-8">
                                {QUICK_ACTIONS.map((act, i) => (
                                    <motion.button 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={act.id} 
                                        onClick={() => handleGptEstimate(null, act.prompt)} 
                                        className="flex items-center justify-start gap-3 md:gap-2.5 bg-white/5 border border-white/20 hover:border-[#ffaa44]/60 hover:bg-[#ffaa44]/15 transition-all duration-300 rounded-[1rem] p-3 md:p-2 text-left w-full group"
                                    >
                                        <div className="w-8 h-8 md:w-6 md:h-6 rounded-full bg-black/80 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-all">
                                            {React.cloneElement(act.icon, { size: 12, className: "text-[#ffaa44]" })}
                                        </div>
                                        <span className="text-white font-medium tracking-wide group-hover:text-[#ffaa44] text-[12px] md:text-[9px] uppercase">{act.label}</span>
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
                    <div className="p-3 md:p-2.5 border-t border-white/10 bg-[#050505]/60 shrink-0 relative z-20">
                        <AnimatePresence>
                            {!isSent && !contactMode && messages.length > 2 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex justify-end mb-2">
                                    <button onClick={handleRequestContact} className="bg-gradient-to-r from-[#ffaa44] to-[#ffcc00] text-black px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-black hover:shadow-lg transition-all flex items-center gap-2">
                                        Отправить диалог менеджеру <ArrowRight size={12} strokeWidth={3} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence mode="wait">
                            {isSent ? (
                                <div className="w-full flex items-center justify-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-2xl">
                                    <CheckCircle2 size={16} className="text-green-400" />
                                    <span className="text-green-300 font-medium text-[12px]">Заявка успешно отправлена!</span>
                                </div>
                            ) : contactMode ? (
                                <form onSubmit={handleContactSubmit} className="relative flex items-center gap-2 md:gap-2.5">
                                    <input type="text" value={contactInput} onChange={(e) => setContactInput(e.target.value)} placeholder="Telegram (например: @durov)" className="flex-1 w-full bg-black/40 border border-[#ffaa44]/50 rounded-full px-5 py-3 md:py-2.5 text-[13px] text-white outline-none" autoFocus />
                                    <button type="submit" className="w-12 h-12 md:w-9 md:h-9 shrink-0 rounded-full bg-[#ffaa44] text-black flex items-center justify-center"><Send size={14} /></button>
                                </form>
                            ) : (
                                <form onSubmit={(e) => handleGptEstimate(e)} className="relative flex items-center gap-2 md:gap-2.5">
                                    <input type="text" value={gptInput} onChange={(e) => setGptInput(e.target.value)} placeholder="Опишите задачу подробнее..." className="flex-1 w-full bg-black/40 border border-white/20 rounded-full px-5 py-3 md:py-2.5 text-[13px] text-white outline-none" />
                                    <button type="submit" className="w-12 h-12 md:w-9 md:h-9 shrink-0 rounded-full bg-white/10 text-white flex items-center justify-center"><Send size={14} /></button>
                                </form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
                <div className="shrink-0 mt-4 flex flex-col items-center justify-center gap-2 mb-2 relative z-10">
                    <div className="flex flex-wrap items-center justify-center gap-x-5 text-[9px] tracking-[0.15em] uppercase font-bold text-white/40">
                        <a href="mailto:hello@kime.xyz">HELLO@KIME.XYZ</a>
                        <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20" />
                        <a href="https://t.me/kime_bot" target="_blank" rel="noreferrer">TELEGRAM</a>
                        <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-white/20" />
                        <a href="tel:+79990000000">+7 (999) 000-00-00</a>
                    </div>
                    <div className="text-[8px] text-white/30 tracking-[0.2em] uppercase font-light">© 2026 КИМЭ. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</div>
                </div>
            </div>
        </div>
    );
};

export default ContactOverlay;
