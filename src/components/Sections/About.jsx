import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Award, X } from 'lucide-react';
import LogoTicker from './LogoTicker';
import useAppStore from '../../store/useAppStore';
import { useFluidScale } from '../../hooks/useFluidScale';

const GlassCard = ({ children, className = "" }) => (
    <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full bg-white/[0.03] backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 shadow-2xl relative overflow-hidden ${className}`}
    >
        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
        {children}
    </motion.div>
);

const About = () => {
    const dsScale = useFluidScale();
    const { slug } = useParams();
    const navigate = useNavigate();
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [aspectRatio, setAspectRatio] = useState(window.innerWidth / window.innerHeight);
    const setScrollLocked = useAppStore(s => s.setScrollLocked);

    const [content, setContent] = useState({
        slide1_title: 'О СТУДИИ',
        slide1_text1: 'KIME — мастерская мультимедийных решений. Мы берем на себя полную ответственность за интерактивный проект: от формирования идеи и защиты концепции до внедрения на площадке и полного технического сопровождения.',
        slide1_text2: 'Мы упаковываем смыслы в цифровой формат. Наша задача — не просто создать визуал, а найти единое видение: от сбора требований до профессиональной защиты концепции перед всеми участниками вашей компании.',
        slide2_title: 'НАШ ПОДХОД',
        slide2_text: 'Для КИМЭ ваш проект — это не работа, а образ жизни на время реализации. Мы против шаблонных решений, поэтому собираем уникальный состав профи под каждый кейс. Наша работа — быть той точкой опоры, где стресс превращается в качественный результат.',
        slide3_quote: 'Мы знаем, что у вас не всегда всё идет по плану. Мы понимаем, что задачи могут гореть, а вводные — меняться. Наша работа — быть той точкой опоры, где стресс превращается в качественный результат, а доверие важнее пустых обещаний.',
        slide3_name: 'Александр Ким',
        slide3_role: 'Основатель & Креативный директор',
    });

    const [certificates, setCertificates] = useState([]);
    const [isReady, setIsReady] = useState(false);
    const [activeCert, setActiveCert] = useState(0);
    const [selectedFullCert, setSelectedFullCert] = useState(null);

    useEffect(() => {
        if (selectedFullCert) {
            setScrollLocked(true);
        } else {
            setScrollLocked(false);
        }
        return () => setScrollLocked(false);
    }, [selectedFullCert, setScrollLocked]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const [contentRes, certsRes] = await Promise.all([
                    fetch(`${apiUrl}/content/about_page`),
                    fetch(`${apiUrl}/certificates`)
                ]);

                if (contentRes.ok) {
                    const contentData = await contentRes.json();
                    setContent(prev => ({ ...prev, ...contentData }));
                }
                if (certsRes.ok) setCertificates(await certsRes.json());
            } catch (error) {
                console.error('Error fetching about data:', error);
            } finally {
                setIsReady(true);
            }
        };
        fetchData();

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setAspectRatio(window.innerWidth / window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const displayCertificates = certificates.length > 0 ? certificates : [];

    return (
        <section id="about" className="w-full relative bg-transparent scroll-smooth overflow-y-auto no-scrollbar pointer-events-auto h-screen">
            {/* Main Content Stack */}
            <div className="w-full flex flex-col items-center gap-12 md:gap-32 pt-32 pb-60 px-4 md:px-12 max-w-[1440px] mx-auto">
                
                {/* 1. О СТУДИИ */}
                <GlassCard className="max-w-5xl">
                    <h2 className="text-2xl md:text-5xl font-thin mb-10 md:mb-16 text-white uppercase tracking-[0.4em] text-center drop-shadow-2xl">
                        {content.slide1_title}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-20 items-start w-full">
                        <div className="md:col-span-12 lg:col-span-7">
                            <p className="text-white/90 text-sm md:text-lg lg:text-xl font-light leading-relaxed tracking-wide mb-6 text-center md:text-left">
                                {content.slide1_text1}
                            </p>
                        </div>
                        <div className="md:col-span-12 lg:col-span-5 pt-4 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-12 opacity-80">
                            <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-light text-center lg:text-left">
                                {content.slide1_text2}
                            </p>
                        </div>
                    </div>
                    {/* LogoTicker Integration */}
                    {/* LogoTicker Integration - Optimized for Mobile */}
                    <div className="w-full relative h-[60px] md:h-[100px] flex items-center justify-center overflow-hidden mt-8 md:mt-20 border-t border-white/5 pt-4 md:pt-10">
                        <LogoTicker />
                    </div>
                </GlassCard>

                {/* 2. НАШ ПОДХОД */}
                <GlassCard className="max-w-4xl">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[#ffaa44] text-[9px] md:text-[11px] uppercase tracking-[0.6em] mb-6 font-bold">Наш подход</span>
                        <h3 className="text-xl md:text-3xl lg:text-4xl font-thin text-white uppercase mb-8 leading-tight tracking-[0.3em] text-center md:text-left">
                            {content.slide2_title}
                        </h3>
                        <p className="text-gray-300 text-sm md:text-lg lg:text-xl font-light leading-relaxed opacity-90 text-center md:text-left max-w-3xl">
                            {content.slide2_text}
                        </p>
                    </div>
                </GlassCard>

                {/* 3. ОСНОВАТЕЛЬ (QUOTE) */}
                <div className="w-full flex flex-col lg:grid lg:grid-cols-12 gap-10 md:gap-20 items-center max-w-[1240px]">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-5 w-full flex justify-center"
                    >
                        <div className="w-full max-w-[450px] aspect-[4/5] bg-white/5 rounded-[3rem] overflow-hidden grayscale border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative">
                            <img src={content.slide3_photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"} alt="Director" className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-7"
                    >
                        <GlassCard className="p-10 md:p-20">
                            <span className="text-[#ffaa44]/60 text-[9px] uppercase tracking-[0.5em] font-bold mb-10 block text-center md:text-left">Видение и лидерство</span>
                            <blockquote className="text-lg md:text-2xl lg:text-3xl italic text-white leading-snug mb-12 tracking-tight font-light text-center md:text-left">
                                "{content.slide3_quote}"
                            </blockquote>
                            <div className="text-center md:text-left">
                                <p className="text-[#ffaa44] uppercase tracking-[0.4em] text-xs md:text-sm font-black mb-2">{content.slide3_name}</p>
                                <p className="text-gray-400 uppercase tracking-[0.2em] text-[10px] font-medium opacity-60">{content.slide3_role}</p>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>

                {/* 4. НАГРАДЫ / СЕРТИФИКАТЫ */}
                <GlassCard className="max-w-6xl">
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
                        <div className="lg:col-span-6 flex flex-col">
                            <div className="mb-12">
                                <span className="text-[#ffaa44] text-[10px] uppercase tracking-[0.5em] font-bold mb-4 block">Экспертиза</span>
                                <h2 className="text-2xl md:text-3xl font-thin tracking-[0.2em] uppercase text-white">
                                    На Нас полагаются
                                </h2>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-6 no-scrollbar">
                                {displayCertificates.map((cert, index) => (
                                    <button 
                                        key={index} 
                                        onMouseEnter={() => !isMobile && setActiveCert(index)}
                                        onClick={() => isMobile && setActiveCert(index)}
                                        className={`w-full text-left p-6 rounded-3xl transition-all border ${index === activeCert ? 'bg-white/10 border-white/20 shadow-2xl scale-[1.02]' : 'bg-transparent border-transparent opacity-40 hover:opacity-100'}`}
                                    >
                                        <div className="flex items-start gap-6">
                                            <span className={`text-xs font-mono mt-1 ${index === activeCert ? 'text-[#ffaa44]' : 'text-white/20'}`}>{(index + 1).toString().padStart(2, '0')}</span>
                                            <div>
                                                <p className="text-lg md:text-xl font-light tracking-wide text-white">{cert.company}</p>
                                                <p className="text-[10px] uppercase tracking-[0.3em] mt-2 text-[#ffaa44] font-bold">{cert.position}</p>
                                                
                                                <AnimatePresence>
                                                    {isMobile && index === activeCert && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                                                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div 
                                                                className="w-full aspect-[4/5] rounded-2xl overflow-hidden grayscale border border-white/10 shadow-xl cursor-zoom-in"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedFullCert(displayCertificates[index]);
                                                                }}
                                                            >
                                                                <img src={cert.image_url} alt="Certificate" className="w-full h-full object-cover opacity-80" />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="hidden lg:flex lg:col-span-6 h-[500px] justify-center items-center">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={activeCert} 
                                    initial={{ opacity: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    exit={{ opacity: 0, scale: 0.95 }} 
                                    className="relative w-full h-full p-4"
                                >
                                    <div className="absolute inset-0 bg-white/[0.05] backdrop-blur-3xl rounded-[3rem] border border-white/10" />
                                    <div className="h-full w-full relative z-10 rounded-[2rem] overflow-hidden grayscale border border-white/5 shadow-2xl">
                                        <img src={displayCertificates[activeCert]?.image_url} alt="Certificate" className="w-full h-full object-cover opacity-80" />
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </GlassCard>

            </div>
            <AnimatePresence>
                {selectedFullCert && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 md:p-20 pointer-events-auto" onClick={() => setSelectedFullCert(null)}>
                        <button className="absolute top-6 right-6 md:top-12 md:right-12 text-white/50 hover:text-white bg-white/5 p-3 md:p-5 rounded-full border border-white/10 z-[210] transition-all hover:scale-110" onClick={(e) => { e.stopPropagation(); setSelectedFullCert(null); }}>
                            <X size={isMobile ? 24 : 32} strokeWidth={1.5} />
                        </button>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-full max-h-full aspect-[210/297] bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <img src={selectedFullCert.image_url} alt="Full Certificate" className="w-full h-full object-contain" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default About;
