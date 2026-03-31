import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const HomeOverlay = () => {
    return (
        <div className="w-full h-full pointer-events-none relative flex flex-col justify-end">
            <div className="w-full p-8 md:p-12 pb-24 md:pb-12 flex flex-col items-center justify-center md:justify-between md:items-end pointer-events-auto bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div className="space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
                    <p className="text-xs md:text-sm tracking-[0.5em] md:tracking-[0.8em] text-[#ffaa44] uppercase font-bold drop-shadow-lg">KIME STUDIO</p>
                    <h1 className="text-2xl md:text-4xl tracking-[0.3em] md:tracking-[0.4em] text-white uppercase font-thin">ЛИСТАЙТЕ ВНИЗ</h1>
                    
                    {/* Scroll Indicator Icon */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: [0, 1, 1, 0], y: [ -10, 0, 5, 10 ] }}
                        transition={{ 
                            duration: 3, 
                            times: [0, 0.2, 0.8, 1],
                            repeat: 2,
                            repeatDelay: 1
                        }}
                        className="mt-8 text-[#ffaa44]/60"
                    >
                        <ChevronDown size={32} strokeWidth={1} className="animate-bounce" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default HomeOverlay;
