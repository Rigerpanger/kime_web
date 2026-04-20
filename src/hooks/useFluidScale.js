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
            
            // Safely calculate dimensions
            const w = window.innerWidth || 1280;
            const h = window.innerHeight || 800;
            
            // Width-based scale vs Height-based limit
            const widthScale = w / 1280;
            const rawScale = Math.min(widthScale, (h / 800));
            const aspectRatio = w / h;
            
            // Global Balance: Compact 1.3 for TV, Rich 2.6 for Laptop
            const maxAllowedScale = aspectRatio > 1.8 ? 1.3 : 2.6;
            const cappedScale = Math.min(maxAllowedScale, Math.max(1, rawScale));
            
            // Final safety check: never set NaN
            setScale(Number.isFinite(cappedScale) ? cappedScale : 1);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, []);

    return scale;
};
