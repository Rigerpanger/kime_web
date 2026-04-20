import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useAppStore from '../../store/useAppStore';
import { useNavigate, useParams } from 'react-router-dom';
import { useFluidScale } from '../../hooks/useFluidScale';

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
        
        // Standardized Fluid Scaling (1280px reference, 1.8x cap)
        const widthScale = typeof window !== 'undefined' ? window.innerWidth / 1280 : 1;
        const heightScale = typeof window !== 'undefined' ? (window.innerHeight / 800) * 1.3 : 1;
        const dsScale = Math.min(1.8, Math.min(widthScale, heightScale));
        
        const spacing = isMobile ? 120 : Math.min(450, Math.max(300, window.innerWidth * 0.22));
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

const MobileNativeGallery = ({ projects, onProjectSelect, onActiveIndexChange }) => {
    const scrollRef = React.useRef(null);
    const scrollTimeout = React.useRef(null);
    const hasInitialized = React.useRef(false);
    const activeRef = React.useRef(0);

    const originalLen = projects.length;
    const bufferCount = 3; 

    const extendedProjects = React.useMemo(() => {
        if (originalLen === 0) return [];
        if (originalLen === 1) return projects.map(p => ({ ...p, cloneKey: 'real_0', isClone: false }));
        
        const endItems = [];
        for (let i = bufferCount; i > 0; i--) {
            const idx = (((originalLen - i) % originalLen) + originalLen) % originalLen;
            endItems.push({ ...projects[idx], cloneKey: 'front_'+i, isClone: true });
        }
        
        const startItems = [];
        for (let i = 0; i < bufferCount; i++) {
            const idx = i % originalLen;
            startItems.push({ ...projects[idx], cloneKey: 'back_'+i, isClone: true });
        }

        return [
            ...endItems,
            ...projects.map((p, i) => ({ ...p, cloneKey: 'real_'+i, isClone: false })),
            ...startItems
        ];
    }, [projects, originalLen]);

    const centerScrollWithoutAnimation = React.useCallback((targetIndex) => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const targetElement = container.children[targetIndex];
        if (!targetElement) return;

        const paddingLeft = parseFloat(window.getComputedStyle(container).paddingLeft) || 0;
        const scrollPos = targetElement.offsetLeft - paddingLeft;
        
        container.style.scrollBehavior = 'auto'; 
        container.scrollLeft = scrollPos;
        void container.offsetHeight; 
        container.style.scrollBehavior = 'smooth'; 
    }, []);

    useEffect(() => {
        if (scrollRef.current && originalLen > 1 && !hasInitialized.current) {
            setTimeout(() => {
                centerScrollWithoutAnimation(bufferCount);
                hasInitialized.current = true;
                onActiveIndexChange(0);
                activeRef.current = 0;
            }, 50);
        }
    }, [originalLen, onActiveIndexChange, centerScrollWithoutAnimation]);

    const handleScroll = () => {
        if (!scrollRef.current || originalLen <= 1) return;
        const container = scrollRef.current;
        
        if (container.children.length < 2) return;
        const itemTotalWidth = container.children[1].offsetLeft - container.children[0].offsetLeft;
        
        if (itemTotalWidth > 0) {
            const currentAbsoluteIndex = Math.round(container.scrollLeft / itemTotalWidth);
            const safeIndex = Math.max(0, Math.min(currentAbsoluteIndex, extendedProjects.length - 1));
            
            let realIndex = safeIndex - bufferCount;
            realIndex = ((realIndex % originalLen) + originalLen) % originalLen;
            
            if (activeRef.current !== realIndex) {
                 activeRef.current = realIndex;
                 onActiveIndexChange(realIndex);
            }

            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => {
                const settledIndex = Math.round(container.scrollLeft / itemTotalWidth);
                let targetJumpIndex = -1;
                if (settledIndex < bufferCount) {
                    targetJumpIndex = settledIndex + originalLen;
                } else if (settledIndex >= bufferCount + originalLen) {
                    targetJumpIndex = settledIndex - originalLen;
                }

                if (targetJumpIndex !== -1) {
                    centerScrollWithoutAnimation(targetJumpIndex);
                }
            }, 200); 
        }
    };

    if (originalLen === 0) return null;

    return (
        <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="md:absolute inset-x-0 md:top-[48%] md:-translate-y-1/2 w-full h-[400px] flex overflow-x-auto snap-x snap-mandatory pointer-events-auto z-30 px-[7.5vw] gap-4 items-center no-scrollbar relative shrink-0 scroll-smooth"
        >
            {extendedProjects.map((project, idx) => (
                <div 
                    key={project.cloneKey + '_' + idx} 
                    className="flex-shrink-0 w-[85vw] h-[360px] snap-center rounded-3xl relative overflow-hidden group border border-white/10 active:scale-[0.98] transition-transform shadow-2xl"
                    onClick={() => onProjectSelect(project)}
                >
                    <div className="absolute inset-0 bg-black/40 z-0" />
                    {project.cover ? (
                        <img src={project.cover} alt="" className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center">
                            <span className="text-white/10 text-[6rem] font-bold select-none">{project?.title?.[0] || '?'}</span>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-t from-black via-black/40 to-black/10 z-10">
                        <div className="flex flex-wrap gap-2 w-full pr-8" />
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

const ProjectCard = ({ project, custom, onClick, isMobile }) => (
    <motion.div
        custom={{ ...custom, isMobile }}
        variants={cardVariants}
        initial="enter"
        animate="center"
        exit="exit"
        whileHover="hover"
        onClick={() => onClick(project)}
        className="absolute cursor-pointer pointer-events-auto group w-[180px] h-[250px]"
        style={{ transformStyle: "preserve-3d", transformOrigin: "center center" }}
    >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-3xl group-hover:border-white/40 transition-colors duration-500" style={{ transform: "translateZ(-15px)" }} />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl" style={{ transform: "translateZ(-8px)" }} />
        <div className="absolute inset-0 z-0 bg-black/40 rounded-3xl overflow-hidden group-hover:bg-black/10 transition-colors duration-1000 flex items-center justify-center opacity-90 group-hover:opacity-100 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" style={{ transform: "translateZ(-4px)" }}>
            {project.cover ? (
                <img src={project.cover} alt="" className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" />
            ) : null}
            {!project.cover && (
                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <span className="text-white/10 text-[8rem] font-bold leading-none select-none group-hover:text-[#ffaa44]/20 transition-colors duration-500">
                        {project?.title?.[0] || '?'}
                    </span>
                </div>
            )}
            <div className="absolute inset-0 bg-[#ffaa44]/0 group-hover:bg-[#ffaa44]/20 mix-blend-overlay transition-colors duration-700 pointer-events-none" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6 bg-gradient-to-t from-black/90 via-black/10 to-transparent rounded-3xl overflow-hidden transition-all duration-500" style={{ transform: "translateZ(0px)", transformStyle: "preserve-3d" }}>
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
    useEffect(() => { if (!project) setIsVideoOpen(false); }, [project]);
    const getVideoEmbedUrl = (url) => {
        if (!url) return '';
        let embedUrl = url;
        if (url.includes('kinoiscope.com')) embedUrl = url.replace('kinoiscope.com', 'player.kinoiscope.com');
        else if (url.includes('youtube.com/watch?v=')) { const id = url.split('v=')[1]?.split('&')[0]; embedUrl = `https://www.youtube.com/embed/${id}`; }
        else if (url.includes('youtu.be/')) { const id = url.split('youtu.be/')[1]?.split('?')[0]; embedUrl = `https://www.youtube.com/embed/${id}`; }
        else if (url.includes('vimeo.com') && !url.includes('player.')) { const id = url.split('vimeo.com/')[1]?.split('?')[0]; embedUrl = `https://player.vimeo.com/video/${id}`; }
        return embedUrl;
    };
    if (!project) return null;
    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-12 pointer-events-auto bg-black/80"
            >
                <div className="absolute inset-0" onClick={onClose} />
                <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-7xl max-h-[92vh] bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                >
                    <button onClick={() => isVideoOpen ? setIsVideoOpen(false) : onClose()} className="absolute top-8 right-8 z-[200] p-3 rounded-full bg-black/60 border border-white/20 text-white hover:text-[#ffaa44] transition-all">
                        <X size={24} strokeWidth={2.5} />
                    </button>
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        {isVideoOpen ? (
                             <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black/50 border border-white/10 shadow-3xl">
                                <iframe src={getVideoEmbedUrl(project.video_url)} className="absolute inset-0 w-full h-full" allow="autoplay; fullscreen" frameBorder="0"></iframe>
                             </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className={`aspect-square rounded-2xl overflow-hidden relative ${project.video_url ? 'cursor-pointer group' : ''}`} onClick={() => { if (project.video_url) setIsVideoOpen(true); }}>
                                {project.cover ? <img src={project.cover} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5" />}
                                {project.video_url && <div className="absolute inset-0 flex items-center justify-center"><Play size={64} className="text-white opacity-80" /></div>}
                            </div>
                            <div className="flex flex-col justify-center text-white">
                                <h1 className="text-5xl font-thin mb-8 uppercase tracking-wide">{project.title}</h1>
                                <p className="text-lg opacity-80 leading-relaxed mb-10">{project.short_description || project.challenge}</p>
                                <div className="space-y-6">
                                    {project.solution && <div><h4 className="text-xs font-bold text-[#ffaa44] tracking-[0.2em] mb-2 uppercase">Решение</h4><p className="opacity-70">{project.solution}</p></div>}
                                    {project.tech && <div><h4 className="text-xs font-bold text-[#ffaa44] tracking-[0.2em] mb-2 uppercase">Технологии</h4><div className="flex gap-2">{project.tech.map(t => <span key={t} className="px-3 py-1 bg-white/5 border border-white/10 text-[10px]">{t}</span>)}</div></div>}
                                </div>
                            </div>
                          </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const ProjectsOverlay = () => {
    const dsScale = useFluidScale();
    const navigate = useNavigate();
    const { slug: urlSlug } = useParams();
    const lastScroll = React.useRef(0);
    const accumulatedDelta = React.useRef(0);
    
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [{ page, direction }, setPageData] = useState({ page: 0, direction: 0 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [aspectRatio, setAspectRatio] = useState(window.innerWidth / window.innerHeight);
    const [layout, setLayout] = useState({});

    const setIsModalOpen = useAppStore(s => s.setIsModalOpen);
    const setScrollLocked = useAppStore(s => s.setScrollLocked);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setAspectRatio(window.innerWidth / window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        const fetchLayout = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/content/global_layout`);
                if (res.ok) setLayout(await res.json());
            } catch (e) {}
        };
        fetchLayout();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const dynamicTop = useMemo(() => {
        const ar = Number.isFinite(aspectRatio) ? aspectRatio : 1.7;
        const base = 53;  // Target lifted anchor
        if (ar > 1.8) return `${base}%`;
        const correction = Math.min(8, (1.8 - ar) * 12);
        return `${base - (Number.isFinite(correction) ? correction : 0)}%`;
    }, [aspectRatio]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/projects`);
                if (!response.ok) return;
                const data = await response.json();
                setProjects(data || []);
                if (urlSlug) {
                    const p = data.find(item => item.slug === urlSlug);
                    if (p) setSelectedProject(p);
                }
            } catch (e) {} finally { setLoading(false); }
        };
        fetchProjects();
    }, [urlSlug]);

    useEffect(() => { setIsModalOpen(!!selectedProject); return () => setIsModalOpen(false); }, [selectedProject, setIsModalOpen]);

    const [activeIndex, setActiveIndex] = useState(0);

    const handleWheel = (e) => {
        if (selectedProject) return;
        const now = Date.now();
        if (now - lastScroll.current < 300) return; 
        accumulatedDelta.current += e.deltaY;
        if (Math.abs(accumulatedDelta.current) >= 50) {
            paginate(accumulatedDelta.current > 0 ? 1 : -1);
            lastScroll.current = now;
            accumulatedDelta.current = 0;
        }
    };

    const handleProjectSelect = (p) => { setSelectedProject(p); setScrollLocked(true); if (p.slug) navigate(`/projects/${p.slug}`); };
    const handleCloseModal = () => { setSelectedProject(null); setScrollLocked(false); navigate('/projects'); };

    const perPage = isMobile ? 3 : ITEMS_PER_PAGE;
    const totalPages = Math.ceil(projects.length / perPage);
    const currentPage = ((page % totalPages) + totalPages) % totalPages;

    const currentProjects = useMemo(() => {
        const len = projects.length;
        if (len === 0) return [];
        const result = [];
        for (let i = 0; i < Math.min(len, perPage); i++) {
            const idx = (((page * perPage + i) % len) + len) % len;
            result.push({ ...projects[idx], uKey: `${page}_${idx}` });
        }
        return result;
    }, [page, projects, perPage]);

    const paginate = (dir) => { if (projects.length > perPage) setPageData(prev => ({ page: prev.page + dir, direction: dir })); };

    const hOff = isMobile ? (layout?.projects_header_offset_mobile || 0) : 0;
    const cOff = isMobile ? (layout?.projects_content_offset_mobile || 0) : 0;

    return (
        <div style={{ '--ds': 'calc(min(1.25, max(0.9, 100vw / 1700)))' }} className="w-full h-[100dvh] md:min-h-screen pointer-events-none flex flex-col relative overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ transform: `translateY(${hOff}px) ${!isMobile ? 'scale(var(--ds))' : ''}`, transformOrigin: 'bottom center' }} className={`${isMobile ? 'relative pt-20 pb-4' : 'absolute bottom-10'} w-full z-40 flex flex-col items-center px-12 transition-opacity duration-1000`}>
                <div className="relative mb-4 mt-2 w-full max-w-[85vw]">
                    <div className="absolute inset-0 bg-[#ffaa44]/20 blur-[80px] rounded-full scale-[2.5] md:scale-100" />
                    <h1 className="relative text-3xl md:text-6xl font-thin text-white md:text-transparent md:bg-clip-text md:bg-gradient-to-r md:from-white md:via-gray-100 md:to-gray-500 mb-6 uppercase tracking-[0.4em] md:tracking-[0.8em] drop-shadow-xl leading-none text-center whitespace-nowrap">НАШИ РАБОТЫ</h1>
                    <div className="flex items-center justify-center gap-3 opacity-95">
                        <div className="h-[1px] w-8 md:w-20 bg-gradient-to-r from-transparent to-[#ffaa44]/50" />
                        <p className="text-[12px] md:text-[10px] tracking-[0.4em] md:tracking-[0.6em] text-[#ffaa44] uppercase font-bold">То, что вправе показать</p>
                        <div className="h-[1px] w-8 md:w-20 bg-gradient-to-l from-transparent to-[#ffaa44]/50" />
                    </div>
                </div>
            </motion.div>

            {!isMobile && projects.length > perPage && (
                <>
                    <button onClick={() => paginate(-1)} style={{ transform: 'translateY(-50%) scale(var(--ds))' }} className="absolute left-12 top-1/2 z-40 pointer-events-auto w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl text-white/50 hover:text-white transition-all"><ChevronLeft size={24} /></button>
                    <button onClick={() => paginate(1)} style={{ transform: 'translateY(-50%) scale(var(--ds))' }} className="absolute right-12 top-1/2 z-40 pointer-events-auto w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl text-white/50 hover:text-white transition-all"><ChevronRight size={24} /></button>
                </>
            )}

            {!isMobile && (
                <div style={{ transform: 'translateX(-50%) scale(var(--ds))', transformOrigin: 'bottom center' }} className="absolute bottom-32 left-1/2 z-40 flex gap-2 pointer-events-auto">
                    {[...Array(totalPages)].map((_, i) => <div key={i} className={`h-1 transition-all duration-500 rounded-full ${currentPage === i ? 'w-6 bg-[#ffaa44]' : 'w-2 bg-white/20'}`} />)}
                </div>
            )}

            <div style={{ transform: `translateY(${cOff}px)` }} className={`flex-grow flex items-center justify-center overflow-hidden ${isMobile ? 'py-4' : 'absolute inset-0 perspective-[1200px]'}`}>
                {isMobile ? (
                    <div className="flex flex-col w-full h-full justify-around">
                        <MobileNativeGallery projects={projects} onProjectSelect={handleProjectSelect} onActiveIndexChange={setActiveIndex} />
                        {projects[activeIndex] && (
                            <motion.div key={projects[activeIndex].id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-5 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-3">
                                <h4 className="text-white text-lg font-bold uppercase tracking-widest truncate">{projects[activeIndex].title}</h4>
                                <p className="text-gray-300 text-xs font-light leading-relaxed line-clamp-2">{projects[activeIndex].challenge}</p>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <div style={{ position: 'absolute', top: dynamicTop, left: '50%', transform: `translate(-50%, -50%) scale(${dsScale})`, width: '100%', height: '400px', pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onWheel={handleWheel}>
                        <AnimatePresence initial={false} mode="wait" custom={{dir: direction, index: 0}}>
                            <motion.div key={page} custom={{dir: direction, index: 0}} className="flex items-center justify-center relative w-full h-full">
                                {currentProjects.map((p, i) => <ProjectCard key={p.uKey} project={p} isMobile={false} custom={{ dir: direction, index: i, totalCount: currentProjects.length }} onClick={handleProjectSelect} />)}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <ArtifactPassport project={selectedProject} onClose={handleCloseModal} />
        </div>
    );
};

export default ProjectsOverlay;
