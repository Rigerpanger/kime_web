import { useState, useEffect } from 'react';

/**
 * Hook to provide a consistent, refined scaling factor across the app.
 * Gold Standard: 1280px logical width = 1.0 scale.
 * Adjusted v10.0: Strict cap for high-res displays to prevent gigantism.
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
            
            // Global Balance Fix: Capping scale for Large Displays (TVs/Monitors)
            // Anything wider than 1800px is treated as a Large Display regardless of aspect ratio.
            const isLargeDisplay = w > 1800;
            const maxAllowedScale = isLargeDisplay ? 1.6 : (aspectRatio > 1.8 ? 0.7 : 2.9);
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
