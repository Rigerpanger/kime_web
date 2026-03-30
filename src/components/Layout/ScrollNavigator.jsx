import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

const ROUTES = ['/', '/about', '/services', '/projects', '/contact'];

const ScrollNavigator = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let isScrolling = false;
        let touchStartY = 0;

        const handleScroll = (deltaY) => {
            const state = useAppStore.getState();
            if (isScrolling || state.isModalOpen || state.isScrollLocked) return;

            const path = location.pathname;
            const currentIndex = ROUTES.findIndex(route => {
                if (route === '/') return path === '/';
                return path.startsWith(route);
            });
            
            if (currentIndex === -1) return;

            if (deltaY > 50) { // Scroll Down -> Next
                if (currentIndex < ROUTES.length - 1) {
                    isScrolling = true;
                    navigate(ROUTES[currentIndex + 1]);
                    setTimeout(() => isScrolling = false, 1000); // Wait for transition
                }
            } else if (deltaY < -50) { // Scroll Up -> Prev
                if (currentIndex > 0) {
                    isScrolling = true;
                    navigate(ROUTES[currentIndex - 1]);
                    setTimeout(() => isScrolling = false, 1000);
                }
            }
        };

        const onWheel = (e) => handleScroll(e.deltaY);

        const onTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
        const onTouchMove = (e) => {
            const touchEndY = e.touches[0].clientY;
            handleScroll(touchStartY - touchEndY); // positive diff = scroll down
        };

        window.addEventListener('wheel', onWheel);
        window.addEventListener('touchstart', onTouchStart);
        window.addEventListener('touchmove', onTouchMove);

        return () => {
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
        };
    }, [location.pathname, navigate]);

    return null;
};

export default ScrollNavigator;
