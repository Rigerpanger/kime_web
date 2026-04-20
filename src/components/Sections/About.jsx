import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Award, X } from 'lucide-react';
import LogoTicker from './LogoTicker';
import useAppStore from '../../store/useAppStore';
import { useFluidScale } from '../../hooks/useFluidScale';

const SLUGS = ['studio', 'approach', 'founder', 'certificates'];

const About = () => {
    const dsScale = useFluidScale();
    const { slug } = useParams();
    const navigate = useNavigate();
    const currentSlide = Math.max(0, SLUGS.indexOf(slug || 'studio'));
    const totalSlides = 4;
    
    const [activeCert, setActiveCert] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [selectedFullCert, setSelectedFullCert] = useState(null);
    const [aspectRatio, setAspectRatio] = useState(window.innerWidth / window.innerHeight);
    const setScrollLocked = useAppStore(s => s.setScrollLocked);
    const setActiveSlug = useAppStore(s => s.setActiveSlug);

    useEffect(() => {
        if (!isMobile) {
            setActiveSlug(`about-${SLUGS[currentSlide]}`);
        }
    }, [currentSlide, isMobile, setActiveSlug]);

    useEffect(() => {
        if (selectedFullCert) {
            setScrollLocked(true);
        } else {
            setScrollLocked(false);
        }
        return () => setScrollLocked(false);
    }, [selectedFullCert, setScrollLocked]);

    useEffect(() => {
        setSelectedFullCert(null);
    }, [slug]);

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
    const [globalLayout, setGlobalLayout] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const [contentRes, layoutRes, certsRes] = await Promise.all([
                    fetch(`${apiUrl}/content/about_page`),
                    fetch(`${apiUrl}/content/global_layout`),
                    fetch(`${apiUrl}/certificates`)
                ]);

                if (contentRes.ok) {
                    const contentData = await contentRes.json();
                    setContent(prev => ({ ...prev, ...contentData }));
                }
                if (layoutRes.ok) setGlobalLayout(await layoutRes.json());
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

    // Calculate dynamic top offset based on aspect ratio
    // Global Balance Anchor: Lifted to 50% for consistent site-wide horizon
    const dynamicTop = useMemo(() => {
        const ar = Number.isFinite(aspectRatio) ? aspectRatio : 1.7; // default to safe AR
        if (ar > 1.8) return '50%'; 
        const diff = 1.8 - ar;
        const correction = Math.min(8, diff * 12);
        return `${50 - (Number.isFinite(correction) ? correction : 0)}%`;
    }, [aspectRatio]);

    const getLayoutVal = (key) => globalLayout[key] || 0;

    const nextSlide = () => navigate(`/about/${SLUGS[(currentSlide + 1) % totalSlides]}`);
    const prevSlide = () => navigate(`/about/${SLUGS[(currentSlide - 1 + totalSlides) % totalSlides]}`);

    const displayCertificates = certificates.length > 0 ? certificates : [];

    const slides = [
        <motion.div key="studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full relative">
            <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide1_content_offset_desktop') - 5}px)` }} className="w-full flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-thin mb-12 text-white uppercase tracking-[0.4em] text-center md:text-left drop-shadow-2xl">
                    {content.slide1_title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-start w-full">
                    <div className="md:col-span-6">
                        <p className="text-white/95 text-[13px] md:text-sm lg:text-base font-light leading-relaxed tracking-wide mb-2 text-center md:text-left">
                            {content.slide1_text1}
                        </p>
                    </div>
                    <div className="md:col-span-1 hidden md:block" />
                    <div className="md:col-span-5 md:pt-4 border-l border-white/5 pl-10 hidden md:block">
                        <p className="text-gray-400 text-[10px] md:text-[11px] lg:text-xs leading-relaxed font-light">
                            {content.slide1_text2}
                        </p>
                    </div>
                </div>
                <div className="w-full relative h-[70px] flex items-center justify-center overflow-hidden mt-6">
                    <LogoTicker />
                </div>
            </motion.div>
        </motion.div>,
        <motion.div key="approach" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full relative">
            <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide2_content_offset_desktop') + 20}px)` }} className="w-full flex flex-col justify-center">
                <span className="text-[#ffaa44]/40 text-[7px] uppercase tracking-[0.5em] mb-4 font-bold text-center md:text-left">Наш подход</span>
                <h3 className="text-xl md:text-2xl font-thin text-white uppercase mb-4 leading-tight tracking-[0.4em] text-center md:text-left opacity-90">
                    {content.slide2_title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start w-full">
                    <div className="md:col-span-8 lg:col-span-7">
                        <p className="text-gray-300 text-[11px] md:text-sm lg:text-base font-light leading-relaxed opacity-80 text-center md:text-left">
                            {content.slide2_text}
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        <motion.div key="founder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center w-full px-4">
            <div className="flex justify-center md:justify-end">
                <div className="w-[300px] md:w-[400px] max-h-[60vh] aspect-[4/5] bg-zinc-900 rounded-3xl overflow-hidden grayscale border border-white/5 relative shadow-2xl">
                    <img src={content.slide3_photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"} alt="Director" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-[480px]">
                <span className="text-[#ffaa44]/60 text-[7px] uppercase tracking-[0.4em] font-bold mb-8">Видение и лидерство</span>
                <blockquote className="text-base md:text-xl lg:text-2xl italic text-white/95 leading-relaxed mb-10 tracking-tight font-light">
                    "{content.slide3_quote}"
                </blockquote>
                <div className="opacity-70">
                    <p className="text-white uppercase tracking-[0.3em] text-[10px] font-semibold mb-2">{content.slide3_name}</p>
                    <p className="text-gray-400 uppercase tracking-[0.2em] text-[8px] font-medium">{content.slide3_role}</p>
                </div>
            </div>
        </motion.div>,
        <motion.div key="certificates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center w-full px-4" style={{ transform: aspectRatio > 1.8 ? 'scale(0.95)' : 'scale(1)' }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-start w-full">
                <div className="md:col-span-12 lg:col-span-6 flex flex-col pt-2 pl-4 md:pl-10">
                    <div className="mb-6">
                        <h2 className="text-sm md:text-base font-thin tracking-[0.3em] uppercase mb-4 text-white/40">
                            На Нас полагаются
                        </h2>
                        <div className="h-[1px] w-12 bg-[#ffaa44]/30" />
                    </div>
                    <div className="space-y-1 max-h-[250px] md:max-h-[280px] overflow-y-auto pr-6 no-scrollbar border-l border-white/5">
                        {displayCertificates.map((cert, index) => (
                            <button key={index} onMouseEnter={() => setActiveCert(index)} className={`w-full text-left p-3 px-6 rounded-2xl transition-all ${index === activeCert ? 'bg-white/5 shadow-lg' : 'hover:bg-white/[0.02]'}`}>
                                <div className="flex items-start gap-6">
                                    <span className={`text-[9px] font-mono mt-1 transition-colors ${index === activeCert ? 'text-[#ffaa44]' : 'text-white/10'}`}>{(index + 1).toString().padStart(2, '0')}</span>
                                    <div className="flex-1">
                                        <p className={`text-sm md:text-base font-light tracking-wide ${index === activeCert ? 'text-white' : 'text-white/30'}`}>{cert.company} {cert.division}</p>
                                        <p className="text-[8px] uppercase tracking-[0.2em] mt-1 text-white/10 font-medium">{cert.position}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="hidden lg:flex lg:col-span-6 h-[360px] justify-center items-center">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeCert} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative h-full aspect-[210/297] p-2">
                            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl" />
                            <div className="h-full w-full relative z-10 rounded-2xl overflow-hidden shadow-2xl grayscale cursor-zoom-in" onClick={() => setSelectedFullCert(displayCertificates[activeCert])}>
                                <img src={displayCertificates[activeCert]?.image_url} alt="Certificate" className="w-full h-full object-cover opacity-70 transition-opacity hover:opacity-100" />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    ];

    return (
        <section id="about" className="w-full h-screen relative overflow-hidden pointer-events-none">
            {!isMobile && (
                <>
                    <button onClick={prevSlide} className="fixed left-8 top-1/2 -translate-y-1/2 z-[40] p-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-white/30 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all pointer-events-auto hover:scale-110 shadow-2xl">
                        <ChevronLeft size={32} strokeWidth={1.5} />
                    </button>
                    <button onClick={nextSlide} className="fixed right-8 top-1/2 -translate-y-1/2 z-[40] p-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-white/30 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all pointer-events-auto hover:scale-110 shadow-2xl">
                        <ChevronRight size={32} strokeWidth={1.5} />
                    </button>
                </>
            )}

            <div className="absolute inset-0 flex items-center justify-center">
                {isReady && !isMobile && (
                    <div 
                        style={{ 
                            position: 'absolute',
                            top: dynamicTop,
                            left: '50%',
                            transform: `translate(-50%, -50%) scale(${dsScale})`,
                            transformOrigin: 'center center',
                            width: '1280px', 
                            padding: '0 120px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            pointerEvents: 'auto'
                        }}
                    >
                        <AnimatePresence mode="wait">{slides[currentSlide]}</AnimatePresence>
                    </div>
                )}
            </div>

            {!isMobile && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 text-white pointer-events-auto z-40">
                    <div className="flex gap-4 items-center">
                        {[...Array(totalSlides)].map((_, i) => (
                            <button key={i} onClick={() => navigate(`/about/${SLUGS[i]}`)} className={`h-[1px] transition-all duration-700 ${i === currentSlide ? 'w-20 bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)]' : 'w-8 bg-white/10'}`} />
                        ))}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.5em] text-white/20">
                         <span className="text-white/60">{currentSlide + 1}</span>
                         <span className="opacity-10">/</span>
                         <span>{totalSlides}</span>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {selectedFullCert && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-10 pointer-events-auto" onClick={() => setSelectedFullCert(null)}>
                        <button className="absolute top-10 right-10 text-white/70 hover:text-white bg-white/10 p-4 rounded-full border border-white/20 z-[210] transition-all hover:scale-110" onClick={(e) => { e.stopPropagation(); setSelectedFullCert(null); }}>
                            <X size={24} strokeWidth={1} />
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
