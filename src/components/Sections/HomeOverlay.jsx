import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useFluidScale } from '../../hooks/useFluidScale';

const HomeOverlay = () => {
    const dsScale = useFluidScale();
    
    return (
        <div className="w-full h-[100dvh] pointer-events-none relative flex flex-col justify-end items-center pb-12 md:pb-32">
            
            <div 
                style={{ 
                    transform: `scale(${dsScale})`, 
                    transformOrigin: 'bottom center' 
                }}
                className="w-full px-8 flex flex-col items-center justify-center pointer-events-auto relative z-10"
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <p className="text-sm md:text-lg tracking-[0.5em] md:tracking-[0.8em] text-[#ffaa44] uppercase font-bold drop-shadow-lg">
                        СТУДИЯ КИМЭ
                    </p>
                    
                    <div className="flex flex-col items-center gap-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <h1 className="text-xl md:text-2xl tracking-[0.2em] md:tracking-[0.4em] text-white/90 uppercase font-light">
                                Для продолжения листайте вниз
                            </h1>

                            {/* Jumping Scroll Indicator Area */}
                            <motion.div 
                                animate={{ y: [0, -15, 0, -8, 0] }}
                                transition={{ 
                                    duration: 2.5, 
                                    repeat: Infinity,
                                    repeatDelay: 1,
                                    ease: "easeInOut"
                                }}
                                className="flex flex-col items-center text-[#ffaa44]"
                            >
                                <ChevronDown size={40} strokeWidth={1} className="drop-shadow-[0_0_10px_rgba(255,170,68,0.4)]" />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeOverlay;
