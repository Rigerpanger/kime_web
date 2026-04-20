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
            
            // Final factor: don't let width scale blow out height
            const rawScale = Math.min(widthScale, (window.innerHeight / 800));
            const aspectRatio = window.innerWidth / window.innerHeight;
            
            // Global Balance: Limit scale to 1.6 for TV (wide) to reduce composition by ~30%
            // Keep 2.3 for laptops to preserve richness.
            const maxAllowedScale = aspectRatio > 1.8 ? 1.6 : 2.3;
            const cappedScale = Math.min(maxAllowedScale, Math.max(1, rawScale));
            
            setScale(cappedScale);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, []);

    return scale;
};
