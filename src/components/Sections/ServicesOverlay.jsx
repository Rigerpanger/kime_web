import React, { useMemo } from 'react';
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

const ServiceListItem = ({ service, isActive, isHint, index }) => {
    const IconComponent = ICON_MAP[service.icon] || Box;
    const number = (index + 1).toString().padStart(2, '0');
    
    return (
        <NavLink
            to={`/services/${service.slug}`}
            className={`group flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-500 border sweep-container ${
                isActive 
                ? 'bg-white/10 border-white/30 shadow-[0_0_30px_rgba(255,170,68,0.1)] premium-active-border' 
                : isHint 
                ? 'neon-hint-border'
                : 'border-transparent hover:bg-white/[0.03]'
            }`}
        >
            <span className={`text-[10px] font-mono transition-colors duration-500 ${isActive ? 'text-[#ffaa44]' : isHint ? 'text-[#ffcc00] neon-hint-text' : 'text-white/10 group-hover:text-white/30'}`}>
                {number}
            </span>
            <div className={`p-1.5 rounded-lg transition-colors duration-500 ${isActive ? 'text-[#ffaa44]' : isHint ? 'text-[#ffcc00] neon-hint-text' : 'text-gray-500 group-hover:text-white/50'}`}>
                <IconComponent size={18} strokeWidth={isActive || isHint ? 2 : 1} />
            </div>
            <span className={`text-[11px] md:text-xs tracking-widest uppercase transition-colors duration-500 ${isActive ? 'text-white font-medium' : isHint ? 'text-white/80 font-medium' : 'text-white/30 group-hover:text-white/60'}`}>
                {service.title}
                {isHint && <span className="ml-2 text-[8px] text-[#E0F7FF] opacity-60 lowercase transition-opacity animate-pulse">следующее</span>}
            </span>
        </NavLink>
    );
};

const ServicesOverlay = () => {
    const dsScale = useFluidScale();
    const activeSlug = useActiveSlug();
    const [interactionCount, setInteractionCount] = React.useState(0);
    
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

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getOff = (key) => layout?.[key] || 0;
    const hOff = isMobile ? getOff('services_header_offset_mobile') : getOff('services_header_offset_desktop');
    const cOff = isMobile ? getOff('services_content_offset_mobile') : getOff('services_content_offset_desktop');

    React.useEffect(() => {
        const interval = setInterval(() => {
            const detail = {
                section: 'SERVICES',
                data: {
                    ds_scale: dsScale.toFixed(2),
                    header_y: hOff + 'px',
                    content_y: cOff + 'px'
                }
            };
            window.dispatchEvent(new CustomEvent('kime-metric-update', { detail }));
        }, 1000);
        return () => clearInterval(interval);
    }, [hOff, cOff, dsScale]);

    if (!isReady) return null;

    return (
        <div className="w-full h-[100dvh] md:h-full flex flex-col items-center justify-center pt-24 md:pt-20 pb-6 px-8 md:px-16 animate-fade-in md:overflow-y-auto no-scrollbar relative">
            <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                style={{ 
                    transform: `translateY(${hOff - (dsScale > 1.3 ? 40 : 0)}px) scale(${dsScale})`,
                    transformOrigin: 'center center'
                }}
                className="text-xl md:text-2xl font-thin text-white tracking-[0.8em] uppercase mb-6 md:mb-10 opacity-70 text-center shrink-0"
            >
                Наши направления
            </motion.h1>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ 
                    transform: `translateY(${cOff}px) scale(${dsScale})`,
                    transformOrigin: 'center center',
                    width: dsScale > 1.3 ? '95%' : '100%',
                    maxWidth: '1800px'
                }}
                className={`flex flex-col md:flex-row ${dsScale > 1.3 ? 'justify-between' : 'justify-center md:gap-16'} items-start mx-auto overflow-y-auto no-scrollbar py-10`}
            >
                <div className={`${dsScale > 1.3 ? 'md:w-[35%]' : 'md:w-[45%]'} space-y-1 pl-4 md:pl-8`}>
                    {servicesData.map((service, index) => (
                        <ServiceListItem 
                            key={service.id} 
                            service={service} 
                            isActive={activeService?.id === service.id} 
                            isHint={index === hintIndex}
                            index={index}
                        />
                    ))}
                </div>

                {/* Statue Safety Gap */}
                {dsScale > 1.3 && <div className="hidden md:block w-[30%] shrink-0" />}

                <div className={`${dsScale > 1.3 ? 'md:w-[35%]' : 'md:w-[50%]'} min-h-[320px] md:min-h-[350px] flex items-start pr-4 md:pr-12`}>
                    <AnimatePresence mode="wait">
                        {activeService && (
                            <motion.div 
                                key={activeService.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full p-8 md:p-10 border border-white/15 bg-black/60 backdrop-blur-xl rounded-[2.5rem] flex flex-col justify-start relative group shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[220px]"
                            >
                                <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#ffaa44]/50 to-transparent blur-[1px] premium-active-border opacity-50" />
                                <h2 className="text-2xl md:text-3xl font-light text-white mb-6 leading-tight tracking-wide">
                                    {activeService.title}
                                </h2>
                                <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light opacity-95">
                                    {activeService.description}
                                </p>
                                <div className="absolute bottom-4 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    {React.createElement(ICON_MAP[activeService.icon] || Box, { size: 64, strokeWidth: 0.5 })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ServicesOverlay;
