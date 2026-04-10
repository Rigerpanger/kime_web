import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Gamepad2, Glasses, Cpu, Code } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import servicesData from '../../data/services.json';
import useActiveSlug from '../../hooks/useActiveSlug';

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
            className={`group flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-500 border ${
                isActive 
                ? 'bg-white/5 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]' 
                : isHint 
                ? 'neon-hint-border'
                : 'border-transparent hover:bg-white/[0.03]'
            }`}
        >
            <span className={`text-[10px] font-mono transition-colors duration-500 ${isActive ? 'text-white' : isHint ? 'text-[#ffcc00] neon-hint-text' : 'text-white/10 group-hover:text-white/30'}`}>
                {number}
            </span>
            <div className={`p-1.5 rounded-lg transition-colors duration-500 ${isActive ? 'text-white' : isHint ? 'text-[#ffcc00] neon-hint-text' : 'text-gray-500 group-hover:text-white/50'}`}>
                <IconComponent size={18} strokeWidth={isActive || isHint ? 1.5 : 1} />
            </div>
            <span className={`text-[11px] md:text-xs tracking-widest uppercase transition-colors duration-500 ${isActive ? 'text-white font-light' : isHint ? 'text-white/80 font-medium' : 'text-white/30 group-hover:text-white/60'}`}>
                {service.title}
                {isHint && <span className="ml-2 text-[8px] text-[#E0F7FF] opacity-60 lowercase transition-opacity animate-pulse">следующее</span>}
            </span>
        </NavLink>
    );
};

const ServicesOverlay = () => {
    const activeSlug = useActiveSlug();
    
    const activeService = useMemo(() => {
        const found = servicesData.find(s => s.slug === activeSlug);
        return found || servicesData[0];
    }, [activeSlug]);

    const activeIndex = useMemo(() => {
        return servicesData.findIndex(s => s.id === activeService?.id);
    }, [activeService]);

    const hintIndex = (activeIndex + 1) % servicesData.length;

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

    if (!isReady) return null;

    return (
        <div className="w-full h-[100dvh] md:h-full flex flex-col items-center justify-center pt-24 md:pt-20 pb-6 px-8 md:px-16 animate-fade-in md:overflow-y-auto no-scrollbar relative">
            {/* Title */}
            <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                style={{ transform: `translateY(${hOff}px)` }}
                className="text-xl md:text-2xl font-thin text-white tracking-[0.8em] uppercase mb-6 md:mb-10 opacity-70 text-center shrink-0"
            >
                Наши направления
            </motion.h1>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ transform: `translateY(${cOff}px)` }}
                className="container max-w-5xl flex flex-col md:flex-row gap-8 md:gap-16 items-start mx-auto"
            >
                {/* Left Column: List */}
                <div className="w-full md:w-[45%] space-y-1 pl-4 md:pl-8">
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

                <div className="w-full md:w-[55%] min-h-[320px] md:min-h-[350px] flex items-start pr-4 md:pr-12">
                    <AnimatePresence mode="wait">
                        {activeService && (
                            <motion.div 
                                key={activeService.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full p-8 md:p-10 border border-white/10 bg-black/40 backdrop-blur-md rounded-3xl flex flex-col justify-start relative group shadow-2xl min-h-[200px]"
                            >
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                <h2 className="text-xl md:text-2xl font-light text-white mb-6 leading-tight tracking-wide">
                                    {activeService.title}
                                </h2>
                                <p className="text-gray-200 text-base md:text-lg leading-relaxed font-light opacity-95">
                                    {activeService.description}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default ServicesOverlay;
