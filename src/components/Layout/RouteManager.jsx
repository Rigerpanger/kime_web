import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAppStore, { VIEWS } from '../../store/useAppStore';

const RouteManager = () => {
    const location = useLocation();
    const setView = useAppStore((state) => state.setView);
    const setActiveSlug = useAppStore((state) => state.setActiveSlug);

    useEffect(() => {
        const path = location.pathname;

        if (path === '/') {
            setView(VIEWS.HOME);
            setActiveSlug(null);
        }
        else if (path.startsWith('/services')) {
            if (path === '/services') {
                setView(VIEWS.SERVICES);
                setActiveSlug(null);
            } else {
                const slug = path.split('/')[2];
                setView(VIEWS.SERVICE_DETAIL);
                setActiveSlug(slug);
            }
        }
        else if (path === '/projects') {
            setView(VIEWS.PROJECTS);
            setActiveSlug(null);
        }
        else if (path === '/about') {
            setView(VIEWS.ABOUT);
            setActiveSlug(null);
        }
        else if (path === '/contact') {
            setView(VIEWS.CONTACT);
            setActiveSlug(null);
        }

        else {
            setView(VIEWS.HOME); // Fallback
            setActiveSlug(null);
        }

    }, [location, setView, setActiveSlug]);

    return null;
};

export default RouteManager;
