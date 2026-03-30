import React from 'react';
import { NavLink } from 'react-router-dom';

const HomeOverlay = () => {
    return (
        <div className="w-full h-full pointer-events-none">
            {/* Minimalist Bottom Bar */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row justify-between items-end pointer-events-auto bg-gradient-to-t from-black/80 via-black/20 to-transparent">

                <div className="hidden md:block space-y-1">
                    <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase">Interactive Museum</p>
                    <p className="text-[10px] tracking-[0.3em] text-white uppercase">Experience the Unseen</p>
                </div>


            </div>
        </div>
    );
};

export default HomeOverlay;
