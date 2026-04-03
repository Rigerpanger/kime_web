import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Award, X, ZoomIn } from 'lucide-react';
import LogoTicker from './LogoTicker';
import useAppStore from '../../store/useAppStore';

const About = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeCert, setActiveCert] = useState(0);
    const totalSlides = 4;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [selectedFullCert, setSelectedFullCert] = useState(null);
    const setScrollLocked = useAppStore(s => s.setScrollLocked);

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
                
                // Fetch content
                const contentResponse = await fetch(`${apiUrl}/content/about_page`);
                if (contentResponse.ok) {
                    const contentData = await contentResponse.json();
                    setContent(prev => ({ ...prev, ...contentData }));
                }

                // Fetch global layout
                const layoutResponse = await fetch(`${apiUrl}/content/global_layout`);
                if (layoutResponse.ok) {
                    const layoutData = await layoutResponse.json();
                    setGlobalLayout(layoutData);
                }

                // Fetch certificates
                const certsResponse = await fetch(`${apiUrl}/certificates`);
                if (certsResponse.ok) {
                    const certsData = await certsResponse.json();
                    if (certsData && certsData.length > 0) {
                        setCertificates(certsData);
                    }
                }
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

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

    const defaultCertificates = [
        {
            company: "РЖД",
            division: "ВНИИЖТ",
            position: "Заместитель генерального директора А.А Пархаев",
            image_url: "https://images.unsplash.com/photo-1596443686812-2f45229eebc3?q=80&w=600&auto=format&fit=crop"
        },
        {
            company: "РЖД",
            division: "НИИАС",
            position: "Заместитель исполнительного директора А.В Карабельников",
            image_url: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=600&auto=format&fit=crop"
        },
        {
            company: "СБЕР",
            division: "",
            position: "Первый заместитель председателя правления А.А Ведяхин",
            image_url: "https://images.unsplash.com/photo-1627137504443-1597a7e10815?q=80&w=600&auto=format&fit=crop"
        }
    ];

    const displayCertificates = certificates.length > 0 ? certificates : defaultCertificates;

    const MobileAbout = ({ content, displayCertificates, layout }) => {
        const [expandedCert, setExpandedCert] = useState(null);
        const getOff = (key) => layout?.[key] || 0;

        return (
            <div className="w-full pointer-events-auto px-2 pt-24 pb-32 flex flex-col gap-10 relative">
                {/* Slide 1 Mobile */}
                <motion.div 
                    style={{ transform: `translateY(${getOff('about_slide1_content_offset_mobile')}px)` }}
                    className="flex flex-col bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl"
                >
                    <h2 
                        style={{ transform: `translateY(${getOff('about_slide1_header_offset_mobile')}px)` }}
                        className="text-4xl font-thin mb-8 text-white uppercase tracking-wider leading-tight"
                    >
                        {content.slide1_title}
                    </h2>
                    <p className="text-white text-lg font-light leading-relaxed tracking-wide mb-8 opacity-95">
                        {content.slide1_text1}
                    </p>
                    <p className="text-gray-300 font-light leading-relaxed text-base border-l-2 border-[#ffaa44]/50 pl-5">
                        {content.slide1_text2}
                    </p>
                </motion.div>

                {/* Slide 2 Mobile */}
                <motion.div 
                    style={{ transform: `translateY(${getOff('about_slide2_content_offset_mobile')}px)` }}
                    className="flex flex-col bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl"
                >
                    <span className="text-[#ffaa44] text-xs uppercase tracking-[0.5em] mb-4 font-bold">Наш подход</span>
                    <h3 
                        style={{ transform: `translateY(${getOff('about_slide2_header_offset_mobile')}px)` }}
                        className="text-3xl font-thin text-white uppercase mb-6 leading-tight"
                    >
                        {content.slide2_title}
                    </h3>
                    <p className="text-gray-300 text-lg font-light leading-relaxed">
                        {content.slide2_text}
                    </p>
                </motion.div>

                {/* Slide 3 Mobile */}
                <motion.div 
                    style={{ transform: `translateY(${getOff('about_slide3_content_offset_mobile')}px)` }}
                    className="flex flex-col relative w-full"
                >
                    <div className="w-full aspect-[4/5] bg-zinc-900 rounded-3xl overflow-hidden grayscale mb-10 relative shadow-2xl border border-white/5">
                        <img 
                            src={content.slide3_photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"} 
                            alt="Director" 
                            className="w-full h-full object-cover opacity-80"
                        />
                    </div>
                    <div className="flex flex-col bg-white/[0.03] backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-2xl relative w-full">
                        <span className="text-[#ffaa44] drop-shadow-md text-[10px] font-bold uppercase tracking-[0.5em] mb-6">Мастерство и надежность</span>
                        <blockquote 
                            style={{ transform: `translateY(${getOff('about_slide3_header_offset_mobile')}px)` }}
                            className="text-xl font-light italic text-white leading-relaxed mb-8 opacity-95 tracking-tight truncate-multiline"
                        >
                            "{content.slide3_quote}"
                        </blockquote>
                        <div>
                            <p className="text-white uppercase tracking-widest text-sm font-bold mb-1">{content.slide3_name}</p>
                            <p className="text-[#ffaa44]/80 uppercase tracking-widest text-[10px] font-medium">{content.slide3_role}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Slide 4 Mobile */}
                <motion.div 
                    style={{ transform: `translateY(${getOff('about_slide4_content_offset_mobile')}px)` }}
                    className="flex flex-col"
                >
                    <h2 
                        style={{ transform: `translateY(${getOff('about_slide4_header_offset_mobile')}px)` }}
                        className="text-3xl font-thin tracking-widest uppercase mb-4 text-white leading-tight"
                    >
                        Нам доверяют
                    </h2>
                    <div className="h-1 w-16 bg-[#ffaa44] mb-10" />

                    <div className="flex flex-col gap-4">
                        {displayCertificates.map((cert, index) => (
                            <div
                                key={index}
                                onClick={() => setExpandedCert(expandedCert === index ? null : index)}
                                className={`flex flex-col p-6 rounded-2xl bg-black/40 backdrop-blur-md border transition-all duration-500 cursor-pointer overflow-hidden ${expandedCert === index ? 'border-[#ffaa44]/50' : 'border-white/10'}`}
                            >
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex-1">
                                        <h4 className="text-white text-xl font-medium tracking-wide mb-1 transition-colors">{cert.company} {cert.division}</h4>
                                        <p className="text-white/50 text-[10px] leading-relaxed uppercase tracking-widest">{cert.division ? cert.position : (cert.company + ' Team')}</p>
                                    </div>
                                    <div className={`transition-transform duration-500 ${expandedCert === index ? 'rotate-180 text-[#ffaa44]' : 'text-white/20'}`}>
                                        <Award size={24} strokeWidth={1} />
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {expandedCert === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mt-6"
                                        >
                                            <div className="w-full aspect-[210/297] rounded-xl overflow-hidden grayscale border border-white/10">
                                                <img src={cert.image_url} alt="Certificate" className="w-full h-full object-cover" />
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedFullCert(cert); }} className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 text-[10px] uppercase tracking-widest font-bold">Смотреть полностью</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="mt-4 pb-2 w-full flex flex-col items-center">
                    <LogoTicker />
                    <div className="mt-6 flex flex-col items-center opacity-40 animate-bounce">
                        <span className="text-[9px] uppercase tracking-[0.3em] text-white/50 mb-1">Направления</span>
                        <ChevronRight size={18} className="text-gray-500 rotate-90" />
                    </div>
                </div>
            </div>
        );
    };

    const getLayoutVal = (key) => globalLayout[key] || 0;

    const slides = [
        <motion.div
            key="slide1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col max-w-4xl w-full relative"
        >
            <motion.div 
                style={{ transform: `translateY(${getLayoutVal('about_slide1_content_offset_desktop')}px)` }}
                className="w-full flex flex-col justify-center"
            >
                <h2 
                    style={{ transform: `translateY(${getLayoutVal('about_slide1_header_offset_desktop')}px)` }}
                    className="text-3xl md:text-5xl lg:text-5xl font-thin mb-8 text-white uppercase tracking-wider text-center md:text-left"
                >
                    {content.slide1_title}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center w-full">
                    <div className="md:col-span-12 lg:col-span-7">
                        <p className="text-white text-[13px] md:text-base lg:text-lg font-light leading-[1.8] md:leading-relaxed tracking-wide mb-2 opacity-90 text-center md:text-left">
                            {content.slide1_text1}
                        </p>
                    </div>
                    <div className="md:col-span-12 lg:col-span-5 h-full flex items-center">
                        <p className="text-gray-400 font-light leading-[1.8] md:leading-relaxed text-[11px] md:text-xs lg:text-sm border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 text-center md:text-left">
                            {content.slide1_text2}
                        </p>
                    </div>
                </div>

                <div 
                    className="w-full relative h-[110px] md:h-[200px] flex items-center justify-center overflow-hidden"
                    style={{ marginTop: `${getLayoutVal('logoOffsetDesktop') || 48}px` }}
                >
                    <LogoTicker />
                </div>
            </motion.div>
        </motion.div>,

        <motion.div
            key="slide2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col max-w-4xl w-full relative"
        >
            <motion.div 
                style={{ transform: `translateY(${getLayoutVal('about_slide2_content_offset_desktop')}px)` }}
                className="flex flex-col relative items-center md:items-start"
            >
                <span className="text-white/20 text-[10px] uppercase tracking-[0.5em] mb-6">Наш подход</span>
                <h3 
                    style={{ transform: `translateY(${getLayoutVal('about_slide2_header_offset_desktop')}px)` }}
                    className="text-2xl md:text-4xl font-thin text-white/90 uppercase mb-6 leading-relaxed max-w-3xl"
                >
                    {content.slide2_title}
                </h3>
                <p className="text-gray-400 text-base md:text-lg font-light leading-relaxed max-w-2xl">
                    {content.slide2_text}
                </p>
            </motion.div>
        </motion.div>,

        <motion.div
            key="slide3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center w-full max-w-5xl"
        >
            <motion.div 
                style={{ transform: `translateY(${getLayoutVal('about_slide3_content_offset_desktop')}px)` }}
                className="h-[40vh] md:h-[55vh] flex justify-end"
            >
                <div className="w-[85%] h-full bg-zinc-900 rounded-xl overflow-hidden grayscale border border-white/5 relative">
                    <img
                        src={content.slide3_photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"}
                        alt="Director"
                        className="w-full h-full object-cover opacity-50 transition-opacity hover:opacity-80"
                    />
                </div>
            </motion.div>
            <div className="flex flex-col justify-center">
                <span className="text-[#ffaa44] text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Видение и лидерство</span>
                <blockquote 
                    style={{ transform: `translateY(${getLayoutVal('about_slide3_header_offset_desktop')}px)` }}
                    className="text-xl md:text-2xl lg:text-[26px] font-light italic text-white/90 leading-relaxed mb-6 tracking-tight"
                >
                    "{content.slide3_quote}"
                </blockquote>
                <div>
                    <p className="text-white uppercase tracking-widest text-xs font-semibold mb-1">{content.slide3_name}</p>
                    <p className="text-gray-400 uppercase tracking-widest text-[9px] font-medium">{content.slide3_role}</p>
                </div>
            </div>
        </motion.div>,

        <motion.div
            key="slide4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center w-full max-w-6xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
                <div className="md:col-span-12 lg:col-span-6 flex flex-col justify-start relative pt-4 pl-6 md:pl-12 lg:pl-16">
                    <motion.div 
                        style={{ transform: `translateY(${getLayoutVal('about_slide4_content_offset_desktop')}px)` }}
                        className="mb-6 pl-1 text-left"
                    >
                        <h2 
                            style={{ transform: `translateY(${getLayoutVal('about_slide4_header_offset_desktop')}px)` }}
                            className="text-xl md:text-2xl font-thin tracking-widest uppercase mb-3 text-white"
                        >
                            Нам доверяют — мы не подводим
                        </h2>
                        <div className="h-px w-20 bg-gradient-to-r from-white/40 to-transparent" />
                    </motion.div>
                    <div className="space-y-1 max-h-[48vh] overflow-y-auto pr-2 no-scrollbar" onMouseEnter={() => setScrollLocked(true)} onMouseLeave={() => setScrollLocked(false)}>
                        {displayCertificates.map((cert, index) => (
                            <button
                                key={index}
                                onMouseEnter={() => setActiveCert(index)}
                                className={`w-full text-left p-2 px-3.5 rounded-xl transition-all border-l ${index === activeCert ? 'bg-white/5 border-white/60' : 'border-transparent'}`}
                            >
                                <div className="flex items-start gap-4 w-full">
                                    <span className="text-[8px] font-mono mt-1.5 text-white/20">{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm md:text-base font-light tracking-wide ${index === activeCert ? 'text-white' : 'text-white/40'}`}>{cert.company} {cert.division}</p>
                                        <p className="text-[8px] uppercase tracking-[0.15em] mt-1 text-white/10">{cert.position}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="hidden lg:flex lg:col-span-6 h-[58vh] justify-center items-center relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCert}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="relative h-full aspect-[210/297] p-3"
                        >
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10" />
                            <div className="h-full w-full relative z-10 rounded-xl overflow-hidden shadow-2xl grayscale hover:grayscale-0 transition-all cursor-zoom-in group" onClick={() => setSelectedFullCert(displayCertificates[activeCert])}>
                                <img src={displayCertificates[activeCert]?.image_url} alt="Certificate" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    ];

    return (
        <section id="about" className={`w-full relative flex items-center pointer-events-none ${isMobile ? 'min-h-[100dvh]' : 'h-screen overflow-hidden'}`}>
            <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 text-white/40 hover:text-white pointer-events-auto hidden md:block"><ChevronLeft size={56} strokeWidth={1} /></button>
            <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 text-white/40 hover:text-white pointer-events-auto hidden md:block"><ChevronRight size={56} strokeWidth={1} /></button>

            <div className={`container mx-auto px-6 md:px-24 pointer-events-auto relative flex flex-col ${isMobile ? 'h-auto py-10 justify-start items-center' : 'h-full justify-center items-center'}`}>
                <div className={`w-full flex ${isMobile ? 'h-auto justify-center pt-10 pb-10' : 'flex-grow items-center justify-center overflow-hidden'}`}>
                    {isMobile ? (
                        <MobileAbout content={content} displayCertificates={displayCertificates} layout={globalLayout} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                            {isReady && <AnimatePresence mode="wait">{slides[currentSlide]}</AnimatePresence>}
                        </div>
                    )}
                </div>
                {!isMobile && (
                    <div className="absolute bottom-6 flex flex-col items-center gap-4 text-white pointer-events-auto">
                        <div className="flex gap-3 items-center">
                            {[...Array(totalSlides)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentSlide(i)} className={`h-[2px] transition-all duration-500 ${i === currentSlide ? 'w-10 bg-white' : 'w-5 bg-white/40'}`} />
                            ))}
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400">{currentSlide + 1} / {totalSlides}</span>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedFullCert && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-10 pointer-events-auto" onClick={() => setSelectedFullCert(null)}>
                        <button className="absolute top-10 right-10 text-white/50 hover:text-white" onClick={() => setSelectedFullCert(null)}><X size={32} strokeWidth={1} /></button>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative max-w-full max-h-full aspect-[210/297] bg-white rounded-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <img src={selectedFullCert.image_url} alt="Full Certificate" className="w-full h-full object-contain" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default About;
