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
            setActiveSlug('default');
        }
        else if (path.startsWith('/services')) {
            if (path === '/services') {
                setView(VIEWS.SERVICES);
                setActiveSlug('services');
            } else {
                const slug = path.split('/')[2];
                setView(VIEWS.SERVICE_DETAIL);
                setActiveSlug(slug);
            }
        }
        else if (path.startsWith('/projects')) {
            if (path === '/projects') {
                setView(VIEWS.PROJECTS);
                setActiveSlug('projects');
            } else {
                const slug = path.split('/')[2];
                setView(VIEWS.PROJECTS);
                setActiveSlug(slug);
            }
        }
        else if (path === '/about') {
            setView(VIEWS.ABOUT);
            setActiveSlug('about');
        }
        else if (path === '/contact') {
            setView(VIEWS.CONTACT);
            setActiveSlug('contact');
        }
        else {
            setView(VIEWS.HOME); // Fallback
            setActiveSlug('default');
        }

    }, [location, setView, setActiveSlug]);

    return null;
};

export default RouteManager;
