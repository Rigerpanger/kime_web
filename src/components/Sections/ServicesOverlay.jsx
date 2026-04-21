import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Gamepad2, Glasses, Cpu, Code } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import servicesData from '../../data/services.json';
import useActiveSlug from '../../hooks/useActiveSlug';
import { useFluidScale } from '../../hooks/useFluidScale';

const ICON_MAP = {
    Box: Box,
    Gamepad2: Gamepad2,
    Glasses: Glasses,
    Cpu: Cpu,
    Code: Code
};

const ServiceListItem = ({ service, isActive, isHint, index, isMobile }) => {
    const IconComponent = ICON_MAP[service.icon] || Box;
    const number = (index + 1).toString().padStart(2, '0');
    
    return (
        <NavLink
            to={`/services/${service.slug}`}
            className={`group flex items-center gap-6 px-10 py-3 rounded-2xl transition-all duration-500 border sweep-container ${
                isActive 
                ? (isMobile ? 'bg-[#ffaa44]/20 border-[#ffaa44]/40 shadow-lg' : 'bg-white/10 border-white/20 shadow-[0_0_50px_rgba(255,170,68,0.15)] premium-active-border') 
                : isHint 
                ? 'neon-hint-border'
                : 'border-transparent hover:bg-white/[0.05]'
            }`}
        >
            <span className={`text-[10px] font-mono transition-colors duration-500 ${isActive ? 'text-[#ffaa44]' : isHint ? 'text-[#ffcc00] neon-hint-text' : 'text-white/10 group-hover:text-white/30'}`}>
                {number}
            </span>
            <div className={`p-1.5 rounded-xl transition-colors duration-500 ${isActive ? 'text-[#ffaa44]' : isHint ? 'text-[#ffcc00] neon-hint-text' : 'text-gray-500 group-hover:text-white/60'}`}>
                <IconComponent size={18} strokeWidth={isActive || isHint ? 1.5 : 1} />
            </div>
            <span className={`text-[11px] md:text-[12px] tracking-[0.25em] uppercase transition-colors duration-500 ${isActive ? 'text-white font-medium' : isHint ? 'text-white/80 font-medium' : 'text-white/15 group-hover:text-white/40'}`}>
                {service.title}
                {isHint && <span className="ml-3 text-[8px] text-[#E0F7FF] opacity-60 lowercase transition-opacity animate-pulse tracking-normal font-light">следующее</span>}
            </span>
        </NavLink>
    );
};

const ServicesOverlay = () => {
    const dsScale = useFluidScale();
    const activeSlug = useActiveSlug();
    const [interactionCount, setInteractionCount] = React.useState(0);
    const [aspectRatio, setAspectRatio] = useState(window.innerWidth / window.innerHeight);
    
    const activeService = useMemo(() => {
        const found = servicesData.find(s => s.slug === activeSlug);
        return found || servicesData[0];
    }, [activeSlug]);

    const activeIndex = useMemo(() => {
        return servicesData.findIndex(s => s.id === activeService?.id);
    }, [activeService]);

    const hintIndex = interactionCount < 2 ? (activeIndex + 1) % servicesData.length : -1;

    const [layout, setLayout] = React.useState({});
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const [isReady, setIsReady] = React.useState(false);

    React.useEffect(() => {
        const fetchLayout = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const res = await fetch(`${apiUrl}/content/global_layout`);
                if (res.ok) setLayout(await res.json());
            } catch (e) {
                console.error('Layout fetch error:', e);
            } finally {
                setIsReady(true);
            }
        };
        fetchLayout();

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setAspectRatio(window.innerWidth / window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Global Balance Anchor: 50% for Laptop centering, 44% for TV balance (lifted)
    const dynamicTop = useMemo(() => {
        const ar = Number.isFinite(aspectRatio) ? aspectRatio : 1.7;
        const base = ar > 1.8 ? 44 : 50; 
        const diff = 1.8 - ar;
        const correction = Math.min(8, diff * 10);
        return `${base - (Number.isFinite(correction) ? correction : 0)}%`;
    }, [aspectRatio]);
    const getOff = (key) => layout?.[key] || 0;
    const hOff = isMobile ? getOff('services_header_offset_mobile') : 0;
    const cOff = isMobile ? getOff('services_content_offset_mobile') : 0;

    if (!isReady) return null;

    return (
        <section id="services-overlay" className="w-full h-screen relative overflow-hidden pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
                {!isMobile && (
                    <div 
                        style={{ 
                            position: 'absolute',
                            top: dynamicTop,
                            left: '50%',
                            transform: `translate(-50%, -50%) scale(${dsScale})`,
                            transformOrigin: 'center center',
                            width: '1280px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            pointerEvents: 'auto',
                            padding: '0 120px'
                        }}
                    >
                        <motion.h1 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            className={`text-xl md:text-3xl font-thin text-white tracking-[1.0em] uppercase ${aspectRatio > 1.8 ? 'mb-12' : 'mb-24'} opacity-80 text-center shrink-0 drop-shadow-2xl`}
                        >
                            Наши направления
                        </motion.h1>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col md:flex-row justify-center md:gap-10 items-start mx-auto w-full"
                        >
                            <div className="md:w-[45%] space-y-2">
                                {servicesData.map((service, index) => (
                                    <ServiceListItem 
                                        key={service.id} 
                                        service={service} 
                                        isActive={activeService?.id === service.id} 
                                        isHint={index === hintIndex}
                                        index={index}
                                        isMobile={isMobile}
                                    />
                                ))}
                            </div>

                            <div className="md:w-[55%] min-h-[350px] flex items-start">
                                <AnimatePresence mode="wait">
                                    {activeService && (
                                        <motion.div 
                                            key={activeService.id}
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="w-full p-10 md:p-14 border border-white/[0.05] bg-black/40 backdrop-blur-3xl rounded-[2.5rem] flex flex-col justify-start relative group shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
                                        >
                                            <div className="absolute top-0 left-16 right-16 h-[1px] bg-gradient-to-r from-transparent via-[#ffaa44]/20 to-transparent opacity-30" />
                                            <h2 className="text-xl md:text-2xl font-light text-white mb-6 leading-tight tracking-[0.1em] opacity-95">
                                                {activeService.title}
                                            </h2>
                                            <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light opacity-80">
                                                {activeService.description}
                                            </p>
                                            <div className="absolute bottom-10 right-12 opacity-[0.05] group-hover:opacity-[0.1] transition-all duration-1000">
                                                {React.createElement(ICON_MAP[activeService.icon] || Box, { size: 60, strokeWidth: 0.1 })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
                
                {isMobile && (
                    <div className="w-full h-full pointer-events-auto overflow-y-auto no-scrollbar pt-28 px-6 pb-20">
                         <motion.h1 
                            className="text-xl font-thin text-white tracking-[0.6em] uppercase mb-10 opacity-80 text-center"
                        >
                            Наши направления
                        </motion.h1>
                        <div className="space-y-4">
                             {servicesData.map((service, index) => (
                                <div key={service.id} className="flex flex-col gap-2">
                                     <ServiceListItem 
                                        service={service} 
                                        isActive={activeService?.id === service.id} 
                                        index={index}
                                        isMobile={isMobile}
                                    />
                                    {activeService?.id === service.id && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 bg-white/5 rounded-2xl border border-white/10 mt-1"
                                        >
                                            <p className="text-gray-300 text-sm leading-relaxed">{service.description}</p>
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ServicesOverlay;
