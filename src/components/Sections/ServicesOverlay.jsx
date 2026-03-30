import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Gamepad2, Glasses, Cpu, Code } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import servicesData from '../../data/services.json';

const ICON_MAP = {
    Box: Box,
    Gamepad2: Gamepad2,
    Glasses: Glasses,
    Cpu: Cpu,
    Code: Code
};

const ServiceListItem = ({ service, isActive, index }) => {
    const IconComponent = ICON_MAP[service.icon] || Box;
    const number = (index + 1).toString().padStart(2, '0');
    
    return (
        <NavLink
            to={`/services/${service.slug}`}
            className={`group flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-500 border ${
                isActive 
                ? 'bg-white/5 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)]' 
                : 'border-transparent hover:bg-white/[0.03]'
            }`}
        >
            <span className={`text-[10px] font-mono transition-colors duration-500 ${isActive ? 'text-white' : 'text-white/10 group-hover:text-white/30'}`}>
                {number}
            </span>
            <div className={`p-1.5 rounded-lg transition-colors duration-500 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white/50'}`}>
                <IconComponent size={18} strokeWidth={1} />
            </div>
            <span className={`text-[11px] md:text-xs tracking-widest uppercase transition-colors duration-500 ${isActive ? 'text-white font-light' : 'text-white/30 group-hover:text-white/60'}`}>
                {service.title}
            </span>
        </NavLink>
    );
};

const ServicesOverlay = () => {
    const activeSlug = useAppStore(s => s.activeSlug);
    
    const activeService = useMemo(() => {
        const found = servicesData.find(s => s.slug === activeSlug);
        return found || servicesData[0];
    }, [activeSlug]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center pt-32 md:pt-20 pb-4 px-8 md:px-16 animate-fade-in overflow-y-auto no-scrollbar">
            {/* Title */}
            <h1 className="text-xl md:text-2xl font-thin text-white tracking-[0.8em] uppercase mb-8 md:mb-10 opacity-70 text-center mt-6">
                Наши направления
            </h1>

            <div className="container max-w-5xl flex flex-col md:flex-row gap-8 md:gap-16 items-start mx-auto">
                {/* Left Column: List */}
                <div className="w-full md:w-[45%] space-y-1 pl-4 md:pl-8">
                    {servicesData.map((service, index) => (
                        <ServiceListItem 
                            key={service.id} 
                            service={service} 
                            isActive={activeService?.id === service.id} 
                            index={index}
                        />
                    ))}
                </div>

                <div className="w-full md:w-[55%] min-h-[250px] flex items-center pr-4 md:pr-12">
                    {activeService && (
                        <div className="p-8 md:p-10 border border-white/5 bg-white/[0.01] backdrop-blur-xl rounded-3xl animate-fade-in-right flex flex-col justify-center relative group">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <h2 className="text-lg md:text-2xl font-thin text-white mb-4 leading-tight tracking-wide">
                                {activeService.title}
                            </h2>
                            <p className="text-gray-400 text-xs md:text-base leading-relaxed font-light opacity-80">
                                {activeService.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServicesOverlay;
