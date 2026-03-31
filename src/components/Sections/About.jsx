import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Award, MapPin, ExternalLink, Calendar, X, ZoomIn } from 'lucide-react';
import LogoTicker from './LogoTicker';
import { supabase } from '../../lib/supabase';
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
        verticalOffsetMobile: -148,
        verticalOffsetDesktop: -236
    });

    const [certificates, setCertificates] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch content
            const { data: contentData } = await supabase
                .from('site_content')
                .select('content_json')
                .eq('section_key', 'about_page')
                .single();
            
            if (contentData) {
                setContent(prev => ({ ...prev, ...contentData.content_json }));
            }

            // Fetch certificates
            const { data: certsData } = await supabase
                .from('certificates')
                .select('*')
                .order('order_index', { ascending: true });
            
            if (certsData && certsData.length > 0) {
                setCertificates(certsData);
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
            image: "https://images.unsplash.com/photo-1596443686812-2f45229eebc3?q=80&w=600&auto=format&fit=crop"
        },
        {
            company: "РЖД",
            division: "НИИАС",
            position: "Заместитель исполнительного директора А.В Карабельников",
            image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=600&auto=format&fit=crop"
        },
        {
            company: "СБЕР",
            division: "",
            position: "Первый заместитель председателя правления А.А Ведяхин",
            image: "https://images.unsplash.com/photo-1627137504443-1597a7e10815?q=80&w=600&auto=format&fit=crop"
        },
        {
            company: "СТАЛИНГРАД БИТВА",
            division: "",
            position: "Директор музея - заповедника Сталинградская Битва А.В Дементьев",
            image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=600&auto=format&fit=crop"
        },
        {
            company: "СОЮЗМУЛЬТФИЛЬМ",
            division: "",
            position: "Генеральный директор АО Союзмультфильм Б.А Машковцев",
            image: "https://images.unsplash.com/photo-1596443686812-2f45229eebc3?q=80&w=600&auto=format&fit=crop"
        }
    ];

    const displayCertificates = certificates.length > 0 ? certificates : defaultCertificates;

    const MobileAbout = ({ content, displayCertificates }) => {
        const [expandedCert, setExpandedCert] = useState(null);

        return (
            <div className="w-full pointer-events-auto px-2 pt-24 pb-24 flex flex-col gap-16 relative">
                <div className="flex flex-col bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                 <h2 className="text-4xl font-thin mb-8 text-white uppercase tracking-wider leading-tight">{content.slide1_title}</h2>
                 <p className="text-white text-lg font-light leading-relaxed tracking-wide mb-8 opacity-95">
                    {content.slide1_text1}
                 </p>
                 <p className="text-gray-300 font-light leading-relaxed text-base border-l-2 border-[#ffaa44]/50 pl-5">
                    {content.slide1_text2}
                 </p>
            </div>

            <div className="flex flex-col bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                <span className="text-[#ffaa44] text-xs uppercase tracking-[0.5em] mb-4 font-bold">Наш подход</span>
                <h3 className="text-3xl font-thin text-white uppercase mb-6 leading-tight">
                    {content.slide2_title}
                </h3>
                <p className="text-gray-300 text-lg font-light leading-relaxed">
                    {content.slide2_text}
                </p>
            </div>

            <div className="flex flex-col">
                <div className="w-full aspect-[4/5] bg-zinc-900 rounded-2xl overflow-hidden grayscale mb-8 relative shadow-2xl">
                    <img 
                        src={content.slide3_photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"} 
                        alt="Director" 
                        className="w-full h-full object-cover opacity-80"
                    />
                </div>
                <span className="text-white drop-shadow-md text-sm font-medium uppercase tracking-[0.4em] mb-4">Видение и лидерство</span>
                <blockquote className="text-xl md:text-2xl font-normal italic text-white/95 leading-relaxed mb-8 drop-shadow-sm">
                    "{content.slide3_quote}"
                </blockquote>
                <div>
                    <p className="text-white uppercase tracking-widest text-sm font-bold mb-1">{content.slide3_name}</p>
                    <p className="text-[#ffaa44] uppercase tracking-widest text-xs">{content.slide3_role}</p>
                </div>
            </div>

            <div className="flex flex-col">
                <h2 className="text-3xl font-thin tracking-widest uppercase mb-4 text-white leading-tight">Нам доверяют</h2>
                <div className="h-1 w-16 bg-[#ffaa44] mb-10" />
                
                <div className="flex flex-col gap-4">
                    {displayCertificates.map((cert, index) => (
                        <div 
                            key={index} 
                            onClick={() => setExpandedCert(expandedCert === index ? null : index)}
                            className={`flex flex-col p-6 rounded-2xl bg-black/40 backdrop-blur-md border transition-all duration-500 cursor-pointer overflow-hidden ${
                                expandedCert === index ? 'border-[#ffaa44]/50' : 'border-white/10'
                            }`}
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
                                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                        animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="w-full aspect-[210/297] rounded-xl overflow-hidden grayscale border border-white/10 bg-white/5">
                                            <img 
                                                src={cert.image_url} 
                                                alt="Certificate" 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFullCert(cert);
                                            }}
                                            className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 active:scale-95 transition-all"
                                        >
                                            Смотреть полностью
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-8 pb-12 w-full flex flex-col items-center">
                <LogoTicker />
                <div className="mt-24 flex flex-col items-center opacity-60 animate-bounce">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-2">Направления</span>
                    <ChevronRight size={24} className="text-gray-500 rotate-90" />
                </div>
            </div>
        </div>
        );
    };

    const slides = [
        // Slide 1: About Text + Brands
        <motion.div 
            key="about-main"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
                opacity: 1, 
                y: 0,
                marginTop: isMobile ? content.verticalOffsetMobile : content.verticalOffsetDesktop
            }}
            transition={{ 
                marginTop: { duration: 0.8, ease: "easeOut" },
                opacity: { duration: 0.5 },
                y: { duration: 0.5 }
            }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col h-full max-w-4xl w-full relative pt-4 md:pt-8"
        >
            <div className="mb-8 w-full flex flex-col flex-grow">
                <h2 className="text-3xl md:text-5xl lg:text-5xl font-thin mb-8 text-white uppercase tracking-wider text-center md:text-left">{content.slide1_title}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center w-full relative">
                    {/* Visual protection for text readability */}
                    <div className="absolute -inset-8 bg-black/20 blur-3xl -z-10 rounded-full hidden md:block" />
                    
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
            </div>
            
            <div className="w-full relative justify-end mt-auto pb-16">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="pt-4">
                    <LogoTicker />
                </div>
            </div>
        </motion.div>,

        // Slide 2: Approach/Team (Simplified)
        <motion.div 
            key="about-team"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
                opacity: 1, 
                y: 0,
                marginTop: isMobile ? content.verticalOffsetMobile : content.verticalOffsetDesktop
            }}
            transition={{ 
                marginTop: { duration: 0.8, ease: "easeOut" },
                opacity: { duration: 0.5 },
                y: { duration: 0.5 }
            }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col h-full max-w-4xl w-full pt-8 md:pt-12"
        >
            <span className="text-white/20 text-[10px] uppercase tracking-[0.5em] mb-6">Наш подход</span>
            <h3 className="text-2xl md:text-4xl font-thin text-white/90 uppercase mb-6 leading-relaxed max-w-3xl">
                {content.slide2_title}
            </h3>
            <p className="text-gray-400 text-base md:text-lg font-light leading-relaxed max-w-2xl">
                {content.slide2_text}
            </p>
        </motion.div>,

        // Slide 3: Director
        <motion.div 
            key="about-vision"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
                opacity: 1, 
                y: 0,
                marginTop: isMobile ? content.verticalOffsetMobile : content.verticalOffsetDesktop
            }}
            transition={{ 
                marginTop: { duration: 0.8, ease: "easeOut" },
                opacity: { duration: 0.5 },
                y: { duration: 0.5 }
            }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start h-full w-full max-w-5xl pt-8 md:pt-12"
        >
            <div className="h-[40vh] md:h-[55vh] flex justify-end">
                <div className="w-[85%] h-full bg-zinc-900 rounded-xl overflow-hidden grayscale border border-white/5 relative group">
                    <img 
                        src={content.slide3_photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"} 
                        alt="Director" 
                        className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-700"
                    />
                </div>
            </div>
            <div className="flex flex-col justify-center">
                <span className="text-[#ffaa44] text-[10px] uppercase tracking-[0.4em] font-bold mb-4 drop-shadow-md">Видение и лидерство</span>
                <blockquote className="text-xl md:text-2xl lg:text-[26px] font-normal italic text-white/95 leading-relaxed mb-6 tracking-tight drop-shadow-sm">
                    "{content.slide3_quote}"
                </blockquote>
                <div>
                    <p className="text-white uppercase tracking-widest text-xs font-semibold mb-1">{content.slide3_name}</p>
                    <p className="text-gray-400 uppercase tracking-widest text-[9px] font-medium">{content.slide3_role}</p>
                </div>
            </div>
        </motion.div>,

        // Slide 4: Certificates (Editorial Layout)
        <motion.div 
            key="about-certificates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col justify-center h-full max-w-6xl w-full"
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
                {/* Left Side: List */}
                <div className="md:col-span-12 lg:col-span-6 flex flex-col justify-start relative pt-4 pl-6 md:pl-12 lg:pl-16">
                    <div className="mb-6 pl-1 text-left">
                        <h2 className="text-xl md:text-2xl font-thin tracking-widest uppercase mb-3 text-white">Нам доверяют — мы не подводим</h2>
                        <div className="h-px w-20 bg-gradient-to-r from-white/40 to-transparent" />
                    </div>

                    <div 
                        className="space-y-1 max-h-[48vh] overflow-y-auto pr-2 no-scrollbar scroll-smooth"
                        onMouseEnter={() => setScrollLocked(true)}
                        onMouseLeave={() => setScrollLocked(false)}
                        onTouchStart={() => setScrollLocked(true)}
                        onTouchEnd={() => setScrollLocked(false)}
                    >
                        {displayCertificates.map((cert, index) => (
                            <button
                                key={index}
                                onMouseEnter={() => setActiveCert(index)}
                                className={`w-full text-left p-2 px-3.5 rounded-xl transition-all duration-300 group ${
                                    index === activeCert 
                                    ? 'bg-white/5 border-l border-white/60' 
                                    : 'hover:bg-white/[0.03] border-l border-transparent'
                                }`}
                            >
                                <div className="flex items-start gap-4 w-full group-hover:pl-0.5 transition-all">
                                    <span className={`text-[8px] font-mono mt-1.5 transition-colors ${index === activeCert ? 'text-white' : 'text-white/20'}`}>
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm md:text-base font-light tracking-wide transition-colors leading-tight ${
                                            index === activeCert ? 'text-white' : 'text-white/40'
                                        }`}>
                                            {cert.company} {cert.division}
                                        </p>
                                        <p className={`text-[8px] uppercase tracking-[0.15em] mt-1 transition-colors leading-relaxed line-clamp-2 ${
                                            index === activeCert ? 'text-white/40' : 'text-white/10'
                                        }`}>
                                            {cert.position}
                                        </p>
                                    </div>
                                    <div className={`shrink-0 self-center transition-all duration-500 ${index === activeCert ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`}>
                                        <Award className="text-white/30" size={14} strokeWidth={1} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Side: Large Preview */}
                <div className="hidden lg:flex lg:col-span-6 h-[58vh] justify-center items-center relative translate-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeCert}
                            initial={{ opacity: 0, scale: 0.98, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 1.02, x: -10 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="relative h-full aspect-[210/297] p-3"
                        >
                            <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10" />
                            <div 
                                className="h-full w-full relative z-10 rounded-xl overflow-hidden shadow-2xl grayscale hover:grayscale-0 transition-all duration-1000 cursor-zoom-in group/img"
                                onClick={() => setSelectedFullCert(displayCertificates[activeCert])}
                            >
                                <img 
                                    src={displayCertificates[activeCert]?.image_url} 
                                    alt="Certificate"
                                    className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover/img:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                        <ZoomIn size={16} className="text-white" />
                                        <span className="text-[10px] uppercase tracking-widest text-white font-medium">Смотреть полностью</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Decorative background element */}
                            <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full -z-10 opacity-30" />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    ];

    return (
        <section id="about" className={`w-full relative flex items-center pointer-events-none ${isMobile ? 'min-h-[100dvh]' : 'h-screen overflow-hidden'}`}>
            {/* Side Navigation */}
            <button 
                onClick={prevSlide}
                className="absolute left-4 md:left-6 top-[53%] -translate-y-1/2 z-30 p-4 text-white/40 hover:text-white transition-all pointer-events-auto hidden md:block outline-none hover:scale-110"
            >
                <ChevronLeft size={56} strokeWidth={1} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-4 md:right-6 top-[53%] -translate-y-1/2 z-30 p-4 text-white/40 hover:text-white transition-all pointer-events-auto hidden md:block outline-none hover:scale-110"
            >
                <ChevronRight size={56} strokeWidth={1} />
            </button>

            <div className={`container mx-auto px-6 md:px-24 pointer-events-auto relative flex flex-col ${isMobile ? 'h-auto py-10 justify-start items-center' : 'h-full justify-center items-center'}`}>
                
                {/* Content Area */}
                <div className={`w-full flex ${isMobile ? 'h-auto justify-center pt-4 pb-4' : 'h-full items-center justify-center pt-8 md:pt-44 pb-4 md:pb-24'}`}>
                    {isMobile ? (
                        <MobileAbout content={content} displayCertificates={displayCertificates} />
                    ) : (
                        <AnimatePresence mode="wait">
                            {slides[currentSlide]}
                        </AnimatePresence>
                    )}
                </div>


                {/* Bottom Navigation Info */}
                {!isMobile && (
                    <div className="absolute bottom-6 md:bottom-3 flex flex-col items-center gap-4 text-white pointer-events-auto z-30">
                        <div className="flex gap-3 items-center h-4">
                            {[...Array(totalSlides)].map((_, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setCurrentSlide(i)}
                                    className={`h-[2px] transition-all duration-500 outline-none ${i === currentSlide ? 'w-10 bg-white' : 'w-5 bg-white/40 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 font-medium pb-2">
                            {currentSlide + 1} / {totalSlides}
                        </span>
                    </div>
                )}
            </div>

            {/* Lightbox / Fullscreen Modal */}
            <AnimatePresence>
                {selectedFullCert && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-10 pointer-events-auto"
                        onClick={() => setSelectedFullCert(null)}
                    >
                        {/* Close Button */}
                        <button 
                            className="absolute top-6 right-6 md:top-10 md:right-10 z-[110] text-white/50 hover:text-white transition-colors"
                            onClick={() => setSelectedFullCert(null)}
                        >
                            <X size={32} strokeWidth={1.5} />
                        </button>

                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative max-w-full max-h-full aspect-[210/297] bg-white rounded-md overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img 
                                src={selectedFullCert.image_url} 
                                alt="Full Certificate" 
                                className="w-full h-full object-contain"
                            />
                        </motion.div>
                        
                        {/* Info Overlay in Modal */}
                        <div className="absolute bottom-10 left-10 hidden md:block max-w-sm pointer-events-none">
                            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">{selectedFullCert.company}</p>
                            <h4 className="text-white text-xl font-light mb-1">{selectedFullCert.division || selectedFullCert.position}</h4>
                            {selectedFullCert.division && (
                                <p className="text-white/60 text-sm font-light italic">{selectedFullCert.position}</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default About;
