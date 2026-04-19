import { useState, useEffect } from 'react';

/**
 * Hook to provide a consistent, refined scaling factor across the app.
 * Gold Standard: 1280px logical width = 1.0 scale.
 * Capped at 1.8x to prevent overlap on Retina / High-res displays.
 */
export const useFluidScale = () => {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const calculateScale = () => {
            if (typeof window === 'undefined') return 1;
            
            // Width-based scale
            const widthScale = window.innerWidth / 1280;
            
            // Height-based protection: standard height 800px. 
            // We allow it to be a bit more flexible (1.5x taller content relative to width)
            const heightScale = (window.innerHeight / 800) * 1.5;
            
            // Final factor: don't let width scale blow out height, and cap at 1.55
            const rawScale = Math.min(widthScale, heightScale);
            const cappedScale = Math.min(1.55, Math.max(1, rawScale));
            
            setScale(cappedScale);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, []);

    return scale;
};
