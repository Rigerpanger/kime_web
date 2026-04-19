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
        const [expandedCert, setExpandedCert] = useState(null);
        const getOff = (key) => globalLayout?.[key] || 0;

        return (
            <div className="w-full pointer-events-auto px-2 pt-24 pb-32 flex flex-col gap-10 relative">
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
                {/* ... other mobile slides ... */}
                <div className="mt-4 pb-2 w-full flex flex-col items-center">
                    <LogoTicker />
                </div>
            </div>
        );
    };

    const slides = [
        <motion.div key="studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-7xl w-full relative">
            <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide1_content_offset_desktop')}px)` }} className={`w-full flex ${dsScale > 1.3 ? 'justify-between' : 'justify-center'} items-center`}>
                <div className={`flex flex-col ${dsScale > 1.3 ? 'w-[40%]' : 'max-w-xl'} text-left`}>
                    <h2 style={{ transform: `translateY(${getLayoutVal('about_slide1_header_offset_desktop')}px)`, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }} className="text-3xl md:text-5xl font-thin mb-8 text-white uppercase tracking-wider">
                        {content.slide1_title}
                    </h2>
                    <p className="text-white text-[13px] md:text-base lg:text-lg font-light leading-relaxed tracking-wide mb-2 opacity-95">
                        {content.slide1_text1}
                    </p>
                </div>
                {dsScale > 1.3 && <div className="w-[20%] shrink-0" />} {/* Statue Gap */}
                <div className={`flex flex-col ${dsScale > 1.3 ? 'w-[35%]' : 'max-w-xs'} border-l border-white/10 pl-6 hidden md:block`}>
                    <p className="text-gray-200 font-light text-[11px] md:text-xs lg:text-sm leading-relaxed">
                        {content.slide1_text2}
                    </p>
                </div>
            </motion.div>
            <div className="w-full relative h-[150px] md:h-[200px] flex items-center justify-center overflow-hidden mt-12">
                <LogoTicker />
            </div>
        </motion.div>,
        <motion.div key="approach" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col max-w-6xl w-full relative">
            <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide2_content_offset_desktop')}px)` }} className={`flex items-start ${dsScale > 1.3 ? 'justify-between' : 'justify-center border-l border-white/10 pl-10'} w-full`}>
                <div className={`${dsScale > 1.3 ? 'w-[45%]' : 'max-w-xl'} flex flex-col items-start`}>
                    <span className="text-white/40 text-[10px] uppercase tracking-[0.5em] mb-6">Наш подход</span>
                    <h3 style={{ transform: `translateY(${getLayoutVal('about_slide2_header_offset_desktop')}px)` }} className="text-2xl md:text-4xl font-thin text-white uppercase mb-6 leading-relaxed">
                        {content.slide2_title}
                    </h3>
                </div>
                {dsScale > 1.3 && <div className="w-[20%] shrink-0" />} {/* Statue Gap */}
                <div className={`${dsScale > 1.3 ? 'w-[35%]' : 'max-w-md'} pt-12`}>
                    <p className="text-gray-100 text-base md:text-lg font-light leading-relaxed opacity-90">
                        {content.slide2_text}
                    </p>
                </div>
            </motion.div>
        </motion.div>,
        <motion.div key="founder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-between items-center w-full max-w-7xl px-12">
            <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide3_content_offset_desktop')}px)` }} className="w-[35%] h-[55vh] flex justify-end">
                <div className="w-full h-full bg-zinc-900 rounded-xl overflow-hidden grayscale border border-white/5 relative">
                    <img src={content.slide3_photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"} alt="Director" className="w-full h-full object-cover opacity-50" />
                </div>
            </motion.div>
            <div className="w-[25%] shrink-0" /> {/* Statue Gap */}
            <div className="w-[40%] flex flex-col">
                <span className="text-[#ffaa44] text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Видение и лидерство</span>
                <blockquote style={{ transform: `translateY(${getLayoutVal('about_slide3_header_offset_desktop')}px)` }} className="text-xl md:text-2xl lg:text-[26px] font-light italic text-white leading-relaxed mb-6 tracking-tight">
                    "{content.slide3_quote}"
                </blockquote>
                <div>
                    <p className="text-white uppercase tracking-widest text-xs font-semibold mb-1">{content.slide3_name}</p>
                    <p className="text-gray-200 uppercase tracking-widest text-[9px] font-medium opacity-80">{content.slide3_role}</p>
                </div>
            </div>
        </motion.div>,
        <motion.div key="certificates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center w-full max-w-[95%]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start w-full">
                <div className="md:col-span-12 lg:col-span-5 flex flex-col pt-4 pl-6 md:pl-16">
                    <motion.div style={{ transform: `translateY(${getLayoutVal('about_slide4_content_offset_desktop')}px)` }} className="mb-6">
                        <h2 style={{ transform: `translateY(${getLayoutVal('about_slide4_header_offset_desktop')}px)` }} className="text-xl md:text-2xl font-thin tracking-widest uppercase mb-3 text-white">Нам доверяют</h2>
                        <div className="h-px w-20 bg-white/40" />
                    </motion.div>
                    <div className="space-y-1 max-h-[48vh] overflow-y-auto pr-2 no-scrollbar">
                        {displayCertificates.map((cert, index) => (
                            <button key={index} onMouseEnter={() => setActiveCert(index)} className={`w-full text-left p-2 px-3.5 rounded-xl transition-all border-l ${index === activeCert ? 'bg-white/5 border-white/60' : 'border-transparent'}`}>
                                <div className="flex items-start gap-4">
                                    <span className="text-[8px] font-mono mt-1.5 text-white/20">{index + 1}</span>
                                    <div className="flex-1">
                                        <p className={`text-sm md:text-base font-light tracking-wide ${index === activeCert ? 'text-white' : 'text-white/60'}`}>{cert.company} {cert.division}</p>
                                        <p className="text-[8px] uppercase tracking-[0.15em] mt-1 text-white/20">{cert.position}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2 grow shrink-0" /> {/* Statue Gap */}
                <div className="hidden lg:flex lg:col-span-5 h-[58vh] justify-center items-center">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeCert} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="relative h-full aspect-[210/297] p-3">
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10" />
                            <div className="h-full w-full relative z-10 rounded-xl overflow-hidden shadow-2xl grayscale cursor-zoom-in" onClick={() => setSelectedFullCert(displayCertificates[activeCert])}>
                                <img src={displayCertificates[activeCert]?.image_url} alt="Certificate" className="w-full h-full object-cover opacity-90" />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    ];

    return (
        <section id="about" className="w-full relative flex items-center pointer-events-none h-screen overflow-hidden">
            <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-[40] p-4 text-white/40 hover:text-white pointer-events-auto hidden md:block transition-colors"><ChevronLeft size={56} strokeWidth={1} /></button>
            <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-[40] p-4 text-white/40 hover:text-white pointer-events-auto hidden md:block transition-colors"><ChevronRight size={56} strokeWidth={1} /></button>

            <div className="container mx-auto px-6 md:px-24 pointer-events-auto relative h-full flex items-center justify-center">
                <div className="w-full h-full flex flex-col items-center justify-center relative transition-all duration-700 overflow-y-auto no-scrollbar py-20">
                    {isReady && !isMobile && (
                        <div 
                            style={{ 
                                transform: `scale(${dsScale})`, 
                                transformOrigin: 'center center',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <AnimatePresence mode="wait">{slides[currentSlide]}</AnimatePresence>
                        </div>
                    )}
                    {isReady && isMobile && <MobileAbout content={content} displayCertificates={displayCertificates} globalLayout={globalLayout} />}
                </div>
                {!isMobile && (
                    <div className="absolute bottom-6 flex flex-col items-center gap-4 text-white pointer-events-auto">
                        <div className="flex gap-3 items-center">
                            {[...Array(totalSlides)].map((_, i) => (
                                <button key={i} onClick={() => navigate(`/about/${SLUGS[i]}`)} className={`h-[2px] transition-all duration-500 ${i === currentSlide ? 'w-10 bg-white' : 'w-5 bg-white/40'}`} />
                            ))}
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400">{currentSlide + 1} / {totalSlides}</span>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedFullCert && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-10 pointer-events-auto" onClick={() => setSelectedFullCert(null)}>
                        <button className="absolute top-10 right-10 text-white/70 hover:text-white bg-white/10 p-3 rounded-full border border-white/20 z-[210] transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedFullCert(null); }}>
                            <X size={28} strokeWidth={1.5} />
                        </button>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-full max-h-full aspect-[210/297] bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <img src={selectedFullCert.image_url} alt="Full Certificate" className="w-full h-full object-contain" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default About;
