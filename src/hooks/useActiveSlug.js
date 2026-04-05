import { useLocation } from 'react-router-dom';

/**
 * Custom hook that instantly identifies the active section slug from the URL.
 * This bypasses the async RouteManager / useEffect flow to ensure 1:1 
 * synchronization between navigation events and 3D scene updates.
 */
const useActiveSlug = () => {
    const location = useLocation();
    const path = location.pathname;

    if (path === '/') return 'default';
    
    if (path.startsWith('/services')) {
        if (path === '/services') return 'services';
        const slug = path.split('/')[2];
        return slug || 'services';
    }
    
    if (path.startsWith('/projects')) {
        if (path === '/projects') return 'projects';
        const slug = path.split('/')[2];
        return slug || 'projects';
    }
    
    if (path === '/about') return 'about';
    if (path === '/contact') return 'contact';

    // Internal about-slides detection if needed for specific logic
    // but usually handled by overlay components.
    
    return 'default';
};

export default useActiveSlug;
