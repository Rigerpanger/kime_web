import React, { useState, useRef, useEffect } from 'react';
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

    const handleGptEstimate = async (e) => {
        if (e) e.preventDefault();
        if (!gptInput.trim() || isThinking) return;

        const userText = gptInput.trim();
        const newMessages = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setGptInput('');
        setIsThinking(true);

        try {
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
            
            if (!apiKey) {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка: API ключ не настроен. Обратитесь к администратору.' }]);
                setIsThinking(false);
                return;
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'Ты профессиональный оценщик стоимости IT и дизайн проектов в креативном агентстве КИМЭ. КИМЭ делает премиальные 3D сайты, брендинг и цифровые инсталляции. На основе описания от пользователя, дай примерную рыночную оценку стоимости (в рублях или долларах) и сроков. Отвечай коротко, стильно и профессионально. В конце каждого сообщения ты ОБЯЗАН добавлять дисклеймер, что "Финальная стоимость определяется только после детального обсуждения с командой КИМЭ".' 
                        },
                        ...newMessages.map(msg => ({ role: msg.role, content: msg.content }))
                    ]
                })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
        } catch (error) {
            console.error('GPT Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Связь с сервером прервалась. Попробуйте позже или оставьте заявку напрямую.' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const inputClasses = (fieldName) => `
        w-full bg-black/60 shadow-inner border 
        ${focusedField === fieldName ? 'border-[#ffcc00] shadow-[0_0_15px_rgba(255,204,0,0.1)]' : 'border-white/10'} 
        rounded-lg px-4 py-3.5 text-white text-[16px] outline-none 
        focus:bg-black/80 transition-all duration-300
    `;

    // === AI Chat Panel ===
    const AiPanel = () => (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-white/5 flex items-center gap-2 shrink-0">
                <div className="w-5 h-5 rounded bg-[#ffcc00]/10 border border-[#ffcc00]/20 flex items-center justify-center text-[#ffcc00]">
                    <Sparkles size={12} />
                </div>
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white leading-none">ИИ-ОЦЕНЩИК</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-lg p-3 text-[14px] leading-relaxed border ${
                            msg.role === 'user' 
                                ? 'bg-[#ffcc00]/10 border-[#ffcc00]/10 text-[#ffcc00] rounded-tr-none' 
                                : 'bg-white/5 border-white/5 text-gray-200 rounded-tl-none'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex w-full justify-start">
                        <div className="max-w-[90%] rounded-lg p-2 bg-white/5 border border-white/5 text-gray-500 rounded-tl-none flex items-center gap-2 text-[8px]">
                            <Loader2 size={10} className="animate-spin" /> АНАЛИЗИРУЮ...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-white/5 bg-black/40 shrink-0">
                <form onSubmit={handleGptEstimate} className="relative">
                    <input 
                        type="text" 
                        value={gptInput}
                        onChange={(e) => setGptInput(e.target.value)}
                        disabled={isThinking}
                        placeholder="Опишите ваш проект..." 
                        className="w-full bg-black/30 shadow-inner border border-white/10 rounded-lg pl-4 pr-12 py-3.5 text-[16px] text-white outline-none focus:border-[#ffcc00]/50 transition-all disabled:opacity-50"
                    />
                    <button 
                        type="submit" 
                        disabled={isThinking || !gptInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#ffcc00] transition-colors disabled:opacity-50"
                    >
                        <Send size={12} />
                    </button>
                </form>
            </div>
        </div>
    );

    // === Request Form Panel ===
    const FormPanel = ({ showClose = false }) => (
        <div className="flex flex-col p-4 md:p-6 h-full overflow-y-auto">
            <div className="mb-3 relative flex justify-between items-start shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ffcc00] animate-pulse shadow-[0_0_5px_#ffcc00]" />
                        <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-medium text-[#ffcc00]">ЗАЯВКА</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-light text-white tracking-tight">Есть задача?</h1>
                </div>
                {showClose && (
                    <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white p-1 outline-none">
                        <X size={18} />
                    </button>
                )}
            </div>

            <form className="space-y-2 flex-1" onSubmit={(e) => e.preventDefault()}>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#ffcc00] transition-colors">
                        <User size={12} strokeWidth={1.5} />
                    </div>
                    <input type="text" onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                        className={`${inputClasses('name')} pl-10`} placeholder="ИМЯ" />
                </div>

                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#ffcc00] transition-colors">
                        <Mail size={12} strokeWidth={1.5} />
                    </div>
                    <input type="text" onFocus={() => setFocusedField('contact')} onBlur={() => setFocusedField(null)}
                        className={`${inputClasses('contact')} pl-10`} placeholder="ТЕЛЕГРАМ / EMAIL" />
                </div>

                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#ffcc00] transition-colors">
                        <DollarSign size={12} strokeWidth={1.5} />
                    </div>
                    <input type="text" onFocus={() => setFocusedField('budget')} onBlur={() => setFocusedField(null)}
                        className={`${inputClasses('budget')} pl-10`} placeholder="БЮДЖЕТ" />
                </div>

                <div className="relative group">
                    <div className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-[#ffcc00] transition-colors">
                        <MessageSquare size={12} strokeWidth={1.5} />
                    </div>
                    <textarea rows="3" onFocus={() => setFocusedField('message')} onBlur={() => setFocusedField(null)}
                        className={`${inputClasses('message')} pl-10 resize-none pt-3`} placeholder="ОПИСАНИЕ ЗАДАЧИ..." />
                </div>

                <div className="pt-4">
                    <button className="w-full group relative overflow-hidden bg-[#ffcc00] text-black py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#ffaa00] hover:shadow-[0_0_20px_rgba(255,204,0,0.3)] outline-none">
                        <span className="text-xs font-black uppercase tracking-[0.2em] relative z-10">ОТПРАВИТЬ</span>
                        <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </form>

            <div className="mt-3 pt-3 flex items-center gap-4 border-t border-white/5 shrink-0">
                <a href="mailto:hello@kime.xyz" className="text-[7px] font-bold tracking-[0.2em] text-white/30 hover:text-[#ffcc00] transition-colors uppercase">hello@kime.xyz</a>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen pointer-events-auto flex justify-center items-center p-4 relative z-50 bg-black/10">
            
            {/* Close Overlay */}
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => navigate('/')} />

            {/* Main Modal */}
            <div className="relative z-10 w-full max-w-2xl bg-[#050505]/70 backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1),0_0_10px_rgba(255,255,255,0.05)] rounded-xl overflow-hidden transform translate-y-10">
                
                {/* ── DESKTOP: side-by-side "book" layout ── */}
                <div className="hidden md:flex flex-row h-[380px]">
                    {/* Left: AI */}
                    <div className="w-1/2 flex flex-col border-r border-white/5 bg-white/[0.01]">
                        <AiPanel />
                    </div>
                    {/* Right: Form */}
                    <div className="w-1/2 flex flex-col">
                        <FormPanel showClose={false} />
                    </div>
                </div>

                {/* ── MOBILE: tabbed layout ── */}
                <div className="md:hidden flex flex-col">
                    {/* Tab Bar */}
                    <div className="flex border-b border-white/10 shrink-0">
                        <button
                            onClick={() => setMobileTab('ai')}
                            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 outline-none ${
                                mobileTab === 'ai' ? 'text-[#ffcc00] border-b-2 border-[#ffcc00]' : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            <Sparkles size={14} /> ИИ-ОЦЕНКА
                        </button>
                        <button
                            onClick={() => setMobileTab('form')}
                            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 outline-none ${
                                mobileTab === 'form' ? 'text-[#ffcc00] border-b-2 border-[#ffcc00]' : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            <Mail size={14} /> ЗАЯВКА
                        </button>
                        <button onClick={() => navigate('/')} className="px-4 text-gray-600 hover:text-white outline-none">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Active Tab Content */}
                    <div className="h-[55vh] min-h-[450px]">
                        {mobileTab === 'ai' ? <AiPanel /> : <FormPanel />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactOverlay;
