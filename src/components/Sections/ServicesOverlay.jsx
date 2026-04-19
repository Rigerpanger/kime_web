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
            className={`group flex items-center gap-6 px-6 py-3.5 rounded-2xl transition-all duration-500 border sweep-container ${
                isActive 
                ? 'bg-white/10 border-white/20 shadow-[0_0_40px_rgba(255,170,68,0.1)] premium-active-border' 
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
            <span className={`text-[11px] md:text-xs tracking-[0.25em] uppercase transition-colors duration-500 ${isActive ? 'text-white font-medium' : isHint ? 'text-white/80 font-medium' : 'text-white/25 group-hover:text-white/60'}`}>
                {service.title}
                {isHint && <span className="ml-3 text-[9px] text-[#E0F7FF] opacity-60 lowercase transition-opacity animate-pulse tracking-normal font-light">следующее</span>}
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
        <div className="w-full h-full relative pointer-events-none">
            {/* Main Content centered via absolute translate, scaled */}
            <div className="absolute inset-0 flex items-center justify-center">
                {!isMobile && (
                    <div 
                        style={{ 
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -55%) scale(${dsScale})`,
                            transformOrigin: 'center center',
                            width: '1280px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            pointerEvents: 'auto',
                            padding: '0 80px'
                        }}
                    >
                        <motion.h1 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            style={{ 
                                transform: `translateY(${hOff}px)`,
                                transformOrigin: 'center center'
                            }}
                            className="text-xl md:text-2xl font-thin text-white tracking-[1.2em] uppercase mb-16 md:mb-20 opacity-80 text-center shrink-0"
                        >
                            Наши направления
                        </motion.h1>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ 
                                transform: `translateY(${cOff}px)`,
                                width: '100%'
                            }}
                            className="flex flex-col md:flex-row justify-center md:gap-20 items-start mx-auto"
                        >
                            <div className="md:w-[42%] space-y-2 pl-4 md:pl-10">
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

                            <div className="md:w-[58%] min-h-[350px] md:min-h-[400px] flex items-start pr-4 md:pr-16">
                                <AnimatePresence mode="wait">
                                    {activeService && (
                                        <motion.div 
                                            key={activeService.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            className="w-full p-12 md:p-14 border border-white/10 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] flex flex-col justify-start relative group shadow-[0_30px_70px_rgba(0,0,0,0.4)]"
                                        >
                                            <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#ffaa44]/40 to-transparent opacity-40" />
                                            <h2 className="text-2xl md:text-3xl font-light text-white mb-8 leading-tight tracking-wide">
                                                {activeService.title}
                                            </h2>
                                            <p className="text-gray-200 text-base md:text-lg lg:text-xl leading-relaxed font-light opacity-90">
                                                {activeService.description}
                                            </p>
                                            <div className="absolute bottom-8 right-10 opacity-5 group-hover:opacity-10 transition-all duration-700">
                                                {React.createElement(ICON_MAP[activeService.icon] || Box, { size: 72, strokeWidth: 0.2 })}
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
        </div>
    );
};

export default ServicesOverlay;
