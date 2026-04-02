import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useAppStore from '../../store/useAppStore';
import { useNavigate, useParams } from 'react-router-dom';

const ITEMS_PER_PAGE = 3;

// --- Sequenced 3D Animation Variants ---
const cardVariants = {
    enter: (custom) => ({
        x: custom.dir > 0 ? 800 : -800,
        rotateY: custom.dir > 0 ? -45 : 45, 
        opacity: 0,
        z: -300,
        scale: 0.6
    }),
    center: (custom) => {
        const isMobile = custom.isMobile;
        const count = custom.totalCount || ITEMS_PER_PAGE;
        const offset = (count - 1) / 2;
        
        // On mobile, reduce spacing to show edges of neighbors
        const spacing = isMobile ? 120 : 250;
        const xPos = (custom.index - offset) * spacing;

        return {
            x: xPos,
            rotateY: isMobile && custom.index !== offset ? (custom.index < offset ? 25 : -25) : 0,
            opacity: 1,
            z: isMobile && custom.index !== offset ? -150 : 0,
            scale: isMobile && custom.index !== offset ? 0.85 : 1,
            transition: {
                duration: 0.8,
                delay: isMobile ? 0 : 0.2 + custom.index * 0.05,
                ease: [0.16, 1, 0.3, 1],
            }
        };
    },
    exit: (custom) => ({
        x: custom.dir < 0 ? 800 : -800,
        rotateY: custom.dir < 0 ? -45 : 45,
        opacity: 0,
        z: -300,
        scale: 0.6,
        transition: {
            duration: 0.5,
            delay: custom.index * 0.05,
            ease: [0.7, 0, 0.3, 1],
        }
    })
};

// --- Sub-components ---

// --- Mobile Native Gallery Components ---
const MobileNativeGallery = ({ projects, onProjectSelect, onActiveIndexChange }) => {
    const scrollRef = React.useRef(null);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const scrollLeft = scrollRef.current.scrollLeft;
        const width = scrollRef.current.offsetWidth;
        const index = Math.round(scrollLeft / (width * 0.85)); // 0.85 is card width in vw
        onActiveIndexChange(index);
    };

    return (
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="md:absolute inset-x-0 md:top-[48%] md:-translate-y-1/2 w-full h-[400px] flex overflow-x-auto snap-x snap-mandatory pointer-events-auto z-30 px-[7.5vw] gap-4 items-center no-scrollbar relative shrink-0"
        >
            {projects.map((project, idx) => (
                <div 
                    key={project.id || idx} 
                    className="flex-shrink-0 w-[85vw] h-[360px] snap-center rounded-3xl relative overflow-hidden group border border-white/10 active:scale-[0.98] transition-transform shadow-2xl"
                    onClick={() => onProjectSelect(project)}
                >
                    <div className="absolute inset-0 bg-black/40 z-0" />
                    {project.cover ? (
                        <img src={project.cover} alt="" className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center">
                            <span className="text-white/10 text-[6rem] font-bold select-none">{project.title[0]}</span>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-black via-black/40 to-black/10 z-10">
                        <div className="flex flex-wrap gap-2 w-full pr-8">
                            {project.tags?.map(t => (
                                <span key={t} className="text-[10px] font-bold uppercase tracking-wider text-[#ffaa44] border border-[#ffaa44]/30 px-3 py-1 bg-[#ffaa44]/15 backdrop-blur-md rounded-md">
                                    {t}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-end justify-between mt-auto w-full">
                            <h3 className="text-xl font-bold text-white leading-tight tracking-wide drop-shadow-md pr-4 uppercase">
                                {project.title}
                            </h3>
                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                                {project.video_url ? <Play size={20} className="text-[#ffaa44] fill-[#ffaa44] ml-1" /> : <ArrowUpRight size={22} className="text-[#ffaa44]" />}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <div className="flex-shrink-0 w-[7.5vw] h-full pointer-events-none"></div>
        </div>
    );
};

// --- Desktop 3D Card ---
const ProjectCard = ({ project, custom, onClick, isMobile }) => (
    <motion.div
        custom={{ ...custom, isMobile }}
        variants={cardVariants}
        initial="enter"
        animate="center"
        exit="exit"
        onClick={() => onClick(project)}
        className="absolute cursor-pointer pointer-events-auto group w-[180px] h-[250px]"
        style={{ transformStyle: "preserve-3d", transformOrigin: "center center" }}
    >
        <div 
            className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-3xl group-hover:border-white/40 transition-colors duration-500"
            style={{ transform: "translateZ(-15px)" }}
        />
        <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl"
            style={{ transform: "translateZ(-8px)" }}
        />
        <div 
            className="absolute inset-0 z-0 bg-black/40 rounded-3xl overflow-hidden group-hover:bg-black/10 transition-colors duration-1000 flex items-center justify-center opacity-90 group-hover:opacity-100 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            style={{ transform: "translateZ(-4px)" }}
        >
            {project.cover ? (
                <img src={project.cover} alt="" className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" />
            ) : null}
            {!project.cover && (
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <span className="text-white/10 text-[8rem] font-bold leading-none select-none group-hover:text-[#ffaa44]/20 transition-colors duration-500">
                        {project.title[0]}
                    </span>
                </div>
            )}
            
            <div className="absolute inset-0 bg-[#ffaa44]/0 group-hover:bg-[#ffaa44]/20 mix-blend-overlay transition-colors duration-700 pointer-events-none" />
        </div>
        
        <div 
            className="absolute inset-0 flex flex-col justify-between p-5 md:p-6 bg-gradient-to-t from-black/90 via-black/10 to-transparent rounded-3xl overflow-hidden transition-all duration-500"
            style={{ transform: "translateZ(0px)", transformStyle: "preserve-3d" }}
        >
            <div className="relative z-20 w-full flex flex-wrap gap-1.5 justify-start transform transition-all duration-500 pr-8 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0" style={{ transform: "translateZ(15px)" }}>
                {project.tags.map(t => (
                    <span key={t} className="text-[7px] md:text-[8px] uppercase tracking-wider text-[#ffaa44] border border-[#ffaa44]/30 px-2 py-0.5 bg-[#ffaa44]/10 backdrop-blur-xl rounded-sm">
                        {t}
                    </span>
                ))}
            </div>

            <div className="relative z-20 w-full flex items-end justify-between mt-auto" style={{ transform: "translateZ(15px)" }}>
                <h3 className="text-sm md:text-base font-medium text-left transition-colors duration-500 ease-out leading-tight tracking-wide drop-shadow-md pr-3 uppercase text-white/90 group-hover:text-white">
                    {project.title}
                </h3>
                <motion.div className="text-[#ffaa44] transform transition-all duration-500 shrink-0 mb-0.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0">
                    <ArrowUpRight size={18} strokeWidth={2} />
                </motion.div>
            </div>
            
            <div className="absolute inset-0 rounded-3xl border pointer-events-none transition-colors duration-500 border-white/0 group-hover:border-white/20" />
            
            {project.video_url && (
                 <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/30 transition-opacity duration-500 shadow-lg opacity-0 group-hover:opacity-100" style={{ transform: "translateZ(10px)" }}>
                     <Play size={14} className="text-white fill-white ml-0.5" />
                 </div>
            )}
        </div>
    </motion.div>
);

const ArtifactPassport = ({ project, onClose }) => {
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    useEffect(() => {
        if (!project) setIsVideoOpen(false);
    }, [project]);

    if (!project) return null;
    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 pointer-events-auto bg-black/60"
            >
                <div className="absolute inset-0" onClick={onClose} />
                <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl"
                >
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-[60]"><X size={24} /></button>
                    {isVideoOpen ? (
                        <div className="w-full flex items-center justify-center pt-8">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10 shadow-3xl">
                                <button 
                                    onClick={() => setIsVideoOpen(false)} 
                                    className="absolute top-4 right-4 text-white hover:text-[#ffaa44] transition-colors z-[120] bg-black/60 rounded-full p-2 border border-white/10"
                                >
                                    <X size={24} />
                                </button>
                                <iframe 
                                    src={project.video_url} 
                                    className="absolute inset-0 w-full h-full"
                                    allow="autoplay; fullscreen"
                                    frameBorder="0"
                                ></iframe>
                            </div>
                        </div>
                    ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            <div>
                                <div 
                                    className={`aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative ${project.video_url ? 'cursor-pointer group' : ''}`}
                                    onClick={() => { if (project.video_url) setIsVideoOpen(true); }}
                                >
                                     {project.cover ? (
                                        <img src={project.cover} alt={project.title} className="w-full h-full object-cover text-transparent group-hover:opacity-80 transition-opacity duration-700" />
                                     ) : (
                                        <span className="text-white/10 text-9xl font-bold">{project.title[0]}</span>
                                     )}
                                     {project.video_url && (
                                         <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors z-10">
                                             <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
                                                 <Play size={32} className="text-white fill-white ml-2" />
                                             </div>
                                         </div>
                                     )}
                                     <div className="absolute inset-0 border border-white/10 rounded-2xl mix-blend-overlay pointer-events-none z-20" />
                                </div>
                                {project.client && (
                                    <div className="mt-6 text-[10px] uppercase tracking-[0.4em] text-white/50 font-bold px-2">
                                        ЗАКАЗЧИК: <span className="text-white ml-2 drop-shadow-sm">{project.client}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-3xl md:text-5xl font-thin tracking-wide mb-6 text-white uppercase break-words hyphens-auto drop-shadow-xl" style={{ wordBreak: 'break-word', lineHeight: '1.1' }}>{project.title}</h2>
                                <div className="flex flex-wrap gap-2 mb-8 md:mb-10">
                                    {project.tags.map(t => (
                                        <span key={t} className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#ffaa44] border border-[#ffaa44]/30 px-4 py-1.5 rounded-full bg-[#ffaa44]/10 backdrop-blur-sm font-bold shadow-sm">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <div className="space-y-8 md:space-y-10 text-gray-200 font-light leading-relaxed text-sm md:text-base">
                                    <div><h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-[#ffaa44]/60 mb-2 md:mb-3">ЗАДАЧА</h4><p className="opacity-90 break-words hyphens-auto leading-relaxed">{project.challenge}</p></div>
                                    <div><h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-[#ffaa44]/60 mb-2 md:mb-3">РЕШЕНИЕ</h4><p className="opacity-90 break-words hyphens-auto leading-relaxed">{project.solution}</p></div>
                                    <div><h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-[#ffaa44]/60 mb-2 md:mb-3">ОПИСАНИЕ</h4><p className="opacity-100 text-white font-normal break-words hyphens-auto leading-relaxed">{project.short_description || project.result}</p></div>
                                    <div className="border-t border-white/10 pt-8 md:pt-10 mt-8 md:mt-10">
                                        <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-3 md:mb-4">ТЕХНОЛОГИИ</h4>
                                        <div className="flex flex-wrap gap-4 md:gap-6 text-xs md:text-sm tracking-[0.2em] text-white/70 uppercase">
                                            {project.tech.map(t => <span key={t} className="bg-white/5 px-3 py-1 rounded-sm border border-white/5">{t}</span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// --- Main Overlay ---

const ProjectsOverlay = () => {
    const navigate = useNavigate();
    const { slug: urlSlug } = useParams();
    const lastScroll = React.useRef(0);
    
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [{ page, direction }, setPageData] = useState({ page: 0, direction: 0 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const setIsModalOpen = useAppStore(s => s.setIsModalOpen);
    const setScrollLocked = useAppStore(s => s.setScrollLocked);

    // Clean up scroll lock on unmount
    useEffect(() => {
        return () => setScrollLocked(false);
    }, [setScrollLocked]);

    const accumulatedDelta = React.useRef(0);

    const handleWheel = (e) => {
        // Stop bubbling to prevent other components from reacting
        e.stopPropagation();
        
        if (selectedProject) return;

        const now = Date.now();
        if (now - lastScroll.current < 300) return; // Faster response (300ms instead of 400ms)

        // Accumulate delta for smoother experience on touchpads/slow scrolling
        accumulatedDelta.current += e.deltaY;

        // If total accumulation exceeds threshold (roughly 50-80 for a full "click" feel)
        const threshold = 50; 
        
        if (Math.abs(accumulatedDelta.current) >= threshold) {
            if (accumulatedDelta.current > 0) {
                paginate(1);
            } else {
                paginate(-1);
            }
            // Reset both timer and accumulator
            lastScroll.current = now;
            accumulatedDelta.current = 0;
        } else {
            // Optional: reset accumulator if scrolling direction changes
            if (e.deltaY * accumulatedDelta.current < 0) {
                accumulatedDelta.current = e.deltaY;
            }
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                const response = await fetch(`${apiUrl}/projects`);
                
                if (!response.ok) throw new Error('API Error');
                
                const data = await response.json();
                setProjects(data || []);
                
                // If there's a slug in the URL, find the project and select it
                if (urlSlug && data) {
                    const project = data.find(p => p.slug === urlSlug);
                    if (project) {
                        setSelectedProject(project);
                    }
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [urlSlug]);

    useEffect(() => {
        setIsModalOpen(!!selectedProject);
        return () => setIsModalOpen(false);
    }, [selectedProject, setIsModalOpen]);

    const [activeIndex, setActiveIndex] = useState(0);

    const handleProjectSelect = (project) => {
        setSelectedProject(project);
        setScrollLocked(true); // Explicitly lock scroll on background
        if (project && project.slug) {
            navigate(`/projects/${project.slug}`);
        }
    };

    const handleCloseModal = () => {
        setSelectedProject(null);
        setScrollLocked(false); // Unlock
        navigate('/projects');
    };

    const MOBILE_PER_PAGE = 3;
    const perPage = isMobile ? MOBILE_PER_PAGE : ITEMS_PER_PAGE;

    const totalPages = Math.ceil(projects.length / perPage);
    const currentPage = ((page % totalPages) + totalPages) % totalPages;

    const currentProjects = useMemo(() => {
        const len = projects.length;
        if (len === 0) return [];
        if (len <= perPage) {
            return projects.map((p, i) => ({ ...p, uKey: `single_page_${i}` }));
        }
        const result = [];
        for (let i = 0; i < perPage; i++) {
            const idx = (((page * perPage + i) % len) + len) % len;
            result.push({ ...projects[idx], uKey: `${page}_${idx}` });
        }
        return result;
    }, [page, projects, perPage]);

    const paginate = (newDirection) => {
        if (projects.length <= perPage) return;
        setPageData((prev) => ({ page: prev.page + newDirection, direction: newDirection }));
    };

    const showNavigation = projects.length > perPage;

    return (
        <div className="w-full h-[100dvh] md:min-h-screen pointer-events-none flex flex-col relative">
            
            {/* Header - Top on mobile, Bottom on Desktop */}
            <motion.div 
                initial={{ opacity: 0, y: isMobile ? -20 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`${isMobile ? 'relative pt-20 pb-4' : 'absolute bottom-10'} w-full z-40 pointer-events-auto flex flex-col items-center text-center px-12 shrink-0`}
            >
                <div className="relative mb-2 mt-2 w-full max-w-[85vw]">
                    {/* Decorative background glow */}
                    <div className="absolute inset-0 bg-[#ffaa44]/20 blur-[60px] rounded-full scale-[2.0] md:scale-100" />
                    <h1 className="relative text-2xl md:text-3xl font-thin text-white md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-white md:via-gray-100 md:to-gray-500 mb-3 uppercase tracking-[0.2em] md:tracking-[0.8em] drop-shadow-xl md:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] leading-none whitespace-nowrap transition-all">
                        НАШИ РАБОТЫ
                    </h1>
                    <div className="flex items-center justify-center gap-3 opacity-95">
                        <div className="h-[1px] w-6 md:w-16 bg-gradient-to-r from-transparent to-[#ffaa44]/50" />
                        <p className="text-[11px] md:text-[8px] tracking-[0.3em] md:tracking-[0.5em] text-[#ffaa44] uppercase font-bold drop-shadow-md">То, что вправе показать</p>
                        <div className="h-[1px] w-6 md:w-16 bg-gradient-to-l from-transparent to-[#ffaa44]/50" />
                    </div>
                </div>
            </motion.div>

            {/* Slider Navigation Arrows - Desktop Only */}
            {!isMobile && showNavigation && (
                <>
                    <button 
                        onClick={() => paginate(-1)} 
                        className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-40 pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl text-white/50 hover:text-white hover:border-[#ffaa44]/40 hover:bg-[#ffaa44]/10 transition-all duration-500 group"
                    >
                        <ChevronLeft size={24} strokeWidth={1} className="group-hover:-translate-x-1 transition-transform duration-300" />
                    </button>
                    <button 
                        onClick={() => paginate(1)} 
                        className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-40 pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl text-white/50 hover:text-white hover:border-[#ffaa44]/40 hover:bg-[#ffaa44]/10 transition-all duration-500 group"
                    >
                        <ChevronRight size={24} strokeWidth={1} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                </>
            )}

            {/* Pagination Dots - Desktop Only */}
            {!isMobile && showNavigation && (
                <div className="absolute bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 z-40 flex gap-2 pointer-events-auto">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                const diff = i - currentPage;
                                if (diff !== 0) paginate(diff);
                            }}
                            className={`h-1 transition-all duration-500 rounded-full ${currentPage === i ? 'w-6 bg-[#ffaa44]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                        />
                    ))}
                </div>
            )}

            {/* Main Content Area (Split Mobile/Desktop) */}
            {isMobile ? (
                <div className="flex-grow flex flex-col justify-around py-4">
                    <MobileNativeGallery 
                        projects={projects} 
                        onProjectSelect={handleProjectSelect} 
                        onActiveIndexChange={setActiveIndex}
                    />
                    
                    {/* [8.2] Active Project Glass Info-Plate */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={projects[activeIndex]?.id}
                        className="relative mx-5 z-40 pointer-events-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-3 mb-6"
                    >
                        <div className="flex justify-between items-start gap-4">
                           <h4 className="text-white text-lg font-bold uppercase tracking-widest truncate">{projects[activeIndex]?.title}</h4>
                           <div className="flex flex-wrap gap-2 shrink-0">
                               {projects[activeIndex]?.tech?.slice(0, 2).map(t => (
                                   <span key={t} className="text-[8px] text-[#ffaa44] font-bold uppercase tracking-wider">{t}</span>
                               ))}
                           </div>
                        </div>
                        <p className="text-gray-300 text-xs font-light leading-relaxed line-clamp-2">
                            {projects[activeIndex]?.challenge}
                        </p>
                        <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-3">
                            <span className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-bold">Сдвиньте для просмотра</span>
                            <div className="flex gap-1">
                                {projects.map((_, i) => (
                                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-4 bg-[#ffaa44]' : 'w-1.5 bg-white/10'}`} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center perspective-[1200px] pointer-events-none overflow-hidden z-20">
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-full h-[320px] pointer-events-auto flex items-center justify-center z-10"
                        onWheel={handleWheel}
                        onMouseEnter={() => setScrollLocked(true)}
                        onMouseLeave={() => setScrollLocked(false)}
                    >
                        <AnimatePresence initial={false} mode="wait" custom={{dir: direction, index: 0}}>
                            <motion.div 
                                key={page}
                                custom={{dir: direction, index: 0}}
                                className="flex items-center justify-center relative w-full h-full"
                            >
                                {currentProjects.map((p, i) => (
                                    <ProjectCard 
                                        key={p.uKey} 
                                        project={p}
                                        isMobile={false}
                                        custom={{ 
                                            dir: direction, 
                                            index: i, 
                                            totalCount: currentProjects.length 
                                        }}
                                        onClick={handleProjectSelect}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            <ArtifactPassport project={selectedProject} onClose={handleCloseModal} />
            
        </div>
    );
};

export default ProjectsOverlay;
