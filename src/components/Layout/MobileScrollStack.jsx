import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeOverlay from '../Sections/HomeOverlay';
import About from '../Sections/About';
import ServicesOverlay from '../Sections/ServicesOverlay';
import ProjectsOverlay from '../Sections/ProjectsOverlay';
import ContactOverlay from '../Sections/ContactOverlay';
import useAppStore from '../../store/useAppStore';

const MobileScrollStack = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const containerRef = useRef(null);
    const currentPathRef = useRef(location.pathname);
    const setActiveSlug = useAppStore(s => s.setActiveSlug);

    const sections = [
        { id: 'home', path: '/', component: <HomeOverlay /> },
        { id: 'about', path: '/about', component: <About /> },
        { id: 'services', path: '/services', component: <ServicesOverlay /> },
        { id: 'projects', path: '/projects', component: <ProjectsOverlay /> },
        { id: 'contact', path: '/contact', component: <ContactOverlay /> }
    ];

    useEffect(() => {
        currentPathRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const path = entry.target.getAttribute('data-path');
                    
                    // Only navigate if the current section has legitimately changed.
                    // This protects sub-routes (like /services/item-1) from being reset by the observer.
                    const isNewSection = path === '/' 
                        ? location.pathname !== '/' 
                        : !location.pathname.startsWith(path);

                    if (isNewSection && currentPathRef.current !== path) {
                        currentPathRef.current = path;
                        navigate(path, { replace: true });
                    }
                }
            });
        }, {
            root: containerRef.current,
            threshold: 0.5 // Trigger when 50% of the section is visible
        });

        const elements = document.querySelectorAll('.mobile-scroll-section');
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [navigate]);

    // Reset scroll to top on first mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (containerRef.current) {
                containerRef.current.scrollTo(0, 0);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Handle programmatic navigation (e.g. from the Burger Menu)
    useEffect(() => {
        // Only scroll if the location change wasn't triggered by our own IntersectionObserver
        if (currentPathRef.current === location.pathname) return;
        
        const path = location.pathname;
        const section = sections.find(s => path.startsWith(s.path) && (s.path !== '/' || path === '/'));
        
        if (section && containerRef.current) {
             const el = document.getElementById(`section-${section.id}`);
             if (el) {
                 el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 currentPathRef.current = path;
             }
        }
    }, [location.pathname, sections]);

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 w-full overflow-y-auto overflow-x-hidden pointer-events-auto snap-y snap-mandatory scroll-smooth no-scrollbar z-0"
        >
            {sections.map(section => (
                <div 
                    key={section.id} 
                    id={`section-${section.id}`}
                    data-path={section.path}
                    className="mobile-scroll-section w-full snap-start relative min-h-[100dvh] flex flex-col"
                >
                    <div className="w-full relative z-10 pointer-events-auto flex-1">
                        {section.component}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MobileScrollStack;
