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
        slide2_text: 'Мы верим, что технологии должны служить идее. Наша команда объединяет художников, программистов и инженеров для создания проектов на стыке физического и цифрового миров.',
        slide3_quote: 'Мы знаем, что у вас не всегда всё идет по плану. Мы понимаем, что задачи могут гореть, а вводные — меняться. Наша работа — быть той точкой опоры, где стресс превращается в качественный результат, а доверие важнее пустых обещаний. За это вы платите, за это мы работаем.',
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

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getLayoutVal = (key) => globalLayout[key] || 0;

    // Send metrics to LayoutInspector
    useEffect(() => {
        const interval = setInterval(() => {
            const detail = {
                section: 'ABOUT',
                data: {
                    slide: SLUGS[currentSlide],
                    scale: dsScale.toFixed(2),
                    title_y: getLayoutVal('about_slide1_header_offset_desktop'),
                    content_y: getLayoutVal('about_slide1_content_offset_desktop')
                }
            };
            window.dispatchEvent(new CustomEvent('kime-metric-update', { detail }));
        }, 1000);
        return () => clearInterval(interval);
    }, [currentSlide, globalLayout, dsScale]);

    const nextSlide = () => navigate(`/about/${SLUGS[(currentSlide + 1) % totalSlides]}`);
    const prevSlide = () => navigate(`/about/${SLUGS[(currentSlide - 1 + totalSlides) % totalSlides]}`);

    const defaultCertificates = [
        { company: "РЖД", division: "ВНИИЖТ", position: "Заместитель генерального директора А.А Пархаев", image_url: "https://images.unsplash.com/photo-1596443686812-2f45229eebc3?q=80&w=600&auto=format&fit=crop" },
        { company: "РЖД", division: "НИИАС", position: "Заместитель исполнительного директора А.В Карабельников", image_url: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=600&auto=format&fit=crop" },
        { company: "СБЕР", division: "", position: "Первый заместитель председателя правления А.А Ведяхин", image_url: "https://images.unsplash.com/photo-1627137504443-1597a7e10815?q=80&w=600&auto=format&fit=crop" }
    ];

    const displayCertificates = certificates.length > 0 ? certificates : defaultCertificates;

    const MobileAbout = ({ content, displayCertificates, globalLayout }) => {
        const getOff = (key) => globalLayout?.[key] || 0;

        return (
            <div className="w-full pointer-events-auto px-4 pt-24 pb-32 flex flex-col gap-10 relative overflow-y-auto no-scrollbar">
                <div style={{ transform: `translateY(${getOff('about_slide1_content_offset_mobile')}px)` }} className="flex flex-col bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                    <h2 style={{ transform: `translateY(${getOff('about_slide1_header_offset_mobile')}px)` }} className="text-4xl font-thin mb-8 text-white uppercase tracking-wider leading-tight">{content.slide1_title}</h2>
                    <p className="text-white text-lg font-light leading-relaxed tracking-wide mb-8 opacity-95">{content.slide1_text1}</p>
                    <p className="text-gray-300 font-light leading-relaxed text-base border-l-2 border-[#ffaa44]/50 pl-5">{content.slide1_text2}</p>
                </div>
                <div style={{ transform: `translateY(${getOff('about_slide2_content_offset_mobile')}px)` }} className="flex flex-col bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                    <span className="text-[#ffaa44] text-xs uppercase tracking-[0.5em] mb-4 font-bold">Наш подход</span>
                    <h3 style={{ transform: `translateY(${getOff('about_slide2_header_offset_mobile')}px)` }} className="text-3xl font-thin text-white uppercase mb-6 leading-tight">{content.slide2_title}</h3>
                    <p className="text-gray-300 text-lg font-light leading-relaxed">{content.slide2_text}</p>
                </div>
                <div className="mt-4 pb-2 w-full flex flex-col items-center shrink-0">
                    <LogoTicker />
                </div>
            </div>
        );
    };

    const slides = [
        <motion.div key="studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full relative">
            <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide1_content_offset_desktop') - 20}px)` }} className="w-full flex flex-col justify-center">
                <h2 style={{ transform: `translateY(${getLayoutVal('about_slide1_header_offset_desktop')}px)`, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }} className="text-4xl md:text-5xl font-thin mb-10 text-white uppercase tracking-wider text-center md:text-left">
                    {content.slide1_title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start w-full">
                    <div className="md:col-span-6">
                        <p className="text-white text-[14px] md:text-base lg:text-lg font-light leading-relaxed tracking-wide mb-2 opacity-95 text-center md:text-left">
                            {content.slide1_text1}
                        </p>
                    </div>
                    <div className="md:col-span-1 hidden md:block" /> { /* Spacer */ }
                    <div className="md:col-span-5 md:pt-10 border-l border-white/10 pl-10 hidden md:block">
                        <p className="text-gray-400 font-light text-[12px] md:text-xs lg:text-sm leading-relaxed opacity-80">
                            {content.slide1_text2}
                        </p>
                    </div>
                </div>
                <div className="w-full relative h-[140px] md:h-[180px] flex items-center justify-center overflow-hidden mt-12">
                    <LogoTicker />
                </div>
            </motion.div>
        </motion.div>,
        <motion.div key="approach" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col w-full relative">
            <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide2_content_offset_desktop')}px)` }} className="flex flex-col items-center md:items-start text-center md:text-left">
                <span className="text-white/40 text-[9px] uppercase tracking-[0.6em] mb-10 font-bold">Наш подход</span>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 w-full">
                    <div className="md:col-span-7">
                        <h3 style={{ transform: `translateY(${getLayoutVal('about_slide2_header_offset_desktop')}px)` }} className="text-3xl md:text-5xl font-thin text-white uppercase mb-10 leading-tight tracking-tight">
                            {content.slide2_title}
                        </h3>
                    </div>
                    <div className="md:col-span-5 md:pt-6 border-l border-white/10 pl-12">
                        <p className="text-gray-200 text-base md:text-lg font-light leading-relaxed opacity-90">
                            {content.slide2_text}
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        <motion.div key="founder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center w-full">
            <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide3_content_offset_desktop')}px)` }} className="h-[40vh] md:h-[55vh] flex justify-end">
                <div className="w-[85%] h-full bg-zinc-900 rounded-2xl overflow-hidden grayscale border border-white/5 relative shadow-2xl">
                    <img src={content.slide3_photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"} alt="Director" className="w-full h-full object-cover opacity-60" />
                </div>
            </motion.div>
            <div className="flex flex-col">
                <span className="text-[#ffaa44] text-[9px] uppercase tracking-[0.5em] font-bold mb-8">Видение и лидерство</span>
                <blockquote style={{ transform: `translateY(${getLayoutVal('about_slide3_header_offset_desktop')}px)` }} className="text-xl md:text-2xl lg:text-[28px] font-thin italic text-white leading-tight mb-10 tracking-tight">
                    "{content.slide3_quote}"
                </blockquote>
                <div>
                    <p className="text-white uppercase tracking-[0.3em] text-[11px] font-semibold mb-2">{content.slide3_name}</p>
                    <p className="text-gray-400 uppercase tracking-[0.2em] text-[9px] font-medium opacity-80">{content.slide3_role}</p>
                </div>
            </div>
        </motion.div>,
        <motion.div key="certificates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-24 items-start w-full">
                <div className="md:col-span-12 lg:col-span-6 flex flex-col pt-4 pl-6 md:pl-12">
                    <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide4_content_offset_desktop')}px)` }} className="mb-12">
                        <h2 style={{ transform: `translateY(${getLayoutVal('about_slide4_header_offset_desktop')}px)` }} className="text-2xl md:text-3xl font-thin tracking-[0.4em] uppercase mb-4 text-white">
                            Нам доверяют
                        </h2>
                        <div className="h-[1px] w-20 bg-white/30" />
                    </motion.div>
                    <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-6 no-scrollbar">
                        {displayCertificates.map((cert, index) => (
                            <button key={index} onMouseEnter={() => setActiveCert(index)} className={`w-full text-left p-3 px-6 rounded-2xl transition-all border-l-2 ${index === activeCert ? 'bg-white/5 border-[#ffaa44] shadow-lg' : 'border-transparent hover:bg-white/[0.03]'}`}>
                                <div className="flex items-start gap-6">
                                    <span className={`text-[10px] font-mono mt-1.5 transition-colors ${index === activeCert ? 'text-[#ffaa44]' : 'text-white/20'}`}>{(index + 1).toString().padStart(2, '0')}</span>
                                    <div className="flex-1">
                                        <p className={`text-base md:text-lg font-light tracking-wide ${index === activeCert ? 'text-white font-normal' : 'text-white/60'}`}>{cert.company} {cert.division}</p>
                                        <p className="text-[9px] uppercase tracking-[0.2em] mt-1 text-white/30 font-medium">{cert.position}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="hidden lg:flex lg:col-span-6 h-[60vh] justify-center items-center">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeCert} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }} className="relative h-full aspect-[210/297] p-6">
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl" />
                            <div className="h-full w-full relative z-10 rounded-2xl overflow-hidden shadow-2xl grayscale cursor-zoom-in" onClick={() => setSelectedFullCert(displayCertificates[activeCert])}>
                                <img src={displayCertificates[activeCert]?.image_url} alt="Certificate" className="w-full h-full object-cover opacity-90 transition-opacity hover:opacity-100" />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    ];

    return (
        <section id="about" className="w-full h-screen relative overflow-hidden pointer-events-none">
            {/* NavButtons always absolute relative to viewport */}
            {!isMobile && (
                <>
                    <button onClick={prevSlide} className="fixed left-8 top-1/2 -translate-y-1/2 z-[40] p-6 text-white/10 hover:text-white transition-all pointer-events-auto hover:scale-110"><ChevronLeft size={72} strokeWidth={0.3} /></button>
                    <button onClick={nextSlide} className="fixed right-8 top-1/2 -translate-y-1/2 z-[40] p-6 text-white/10 hover:text-white transition-all pointer-events-auto hover:scale-110"><ChevronRight size={72} strokeWidth={0.3} /></button>
                </>
            )}

            <div className="absolute inset-0 flex items-center justify-center">
                {isReady && !isMobile && (
                    <div 
                        style={{ 
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) scale(${dsScale})`,
                            transformOrigin: 'center center',
                            width: '1280px',
                            padding: '0 100px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            pointerEvents: 'auto'
                        }}
                    >
                        <AnimatePresence mode="wait">{slides[currentSlide]}</AnimatePresence>
                    </div>
                )}
                {isReady && isMobile && (
                    <div className="w-full h-full pointer-events-auto overflow-y-auto no-scrollbar pt-20">
                        <MobileAbout content={content} displayCertificates={displayCertificates} globalLayout={globalLayout} />
                    </div>
                )}
            </div>

            {!isMobile && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 text-white pointer-events-auto z-40">
                    <div className="flex gap-4 items-center">
                        {[...Array(totalSlides)].map((_, i) => (
                            <button key={i} onClick={() => navigate(`/about/${SLUGS[i]}`)} className={`h-[1px] transition-all duration-700 ${i === currentSlide ? 'w-16 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-6 bg-white/15'}`} />
                        ))}
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-mono tracking-[0.5em] text-white/30">
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
                            <X size={32} strokeWidth={1} />
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
