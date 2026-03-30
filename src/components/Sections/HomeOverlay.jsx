import React from 'react';
import { NavLink } from 'react-router-dom';

const HomeOverlay = () => {
    return (
        <div className="w-full h-full pointer-events-none relative flex flex-col justify-end">
            <div className="w-full p-8 md:p-12 mb-20 md:mb-0 flex flex-col md:flex-row justify-center md:justify-between items-center md:items-end pointer-events-auto bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div className="space-y-2 text-center md:text-left">
                    <p className="text-[10px] md:text-xs tracking-[0.4em] md:tracking-[0.5em] text-[#ffaa44] uppercase font-bold drop-shadow-md">KIME STUDIO</p>
                    <p className="text-sm md:text-lg tracking-[0.2em] text-white/90 uppercase font-light">Experience the Unseen</p>
                </div>
            </div>
        </div>
    );
};

export default HomeOverlay;
