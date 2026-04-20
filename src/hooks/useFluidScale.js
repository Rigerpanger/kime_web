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
            
            // Global Balance: Ultra-neat 0.7 for TV, Fully-filled 2.9 for Laptop
            // We allow scale below 1.0 for large displays to maintain 'neat' appearance.
            const maxAllowedScale = aspectRatio > 1.8 ? 0.7 : 2.9;
            const cappedScale = Math.min(maxAllowedScale, rawScale);
            
            // Final safety check: never set NaN
            setScale(Number.isFinite(cappedScale) ? cappedScale : 1);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, []);

    return scale;
};
