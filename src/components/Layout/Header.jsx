import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../../store/useAppStore';

const NavBarItem = ({ to, children, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`
        }
    >
        {children}
    </NavLink>
);

const MobileNavItem = ({ to, children, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `text-2xl font-light tracking-[0.2em] uppercase transition-colors duration-300 block py-4 ${isActive ? 'text-[#ffcc00]' : 'text-gray-400 hover:text-white'}`
        }
    >
        {children}
    </NavLink>
);

const ROUTES = [
    { path: '/',          label: 'ГЛАВНАЯ' },
    { path: '/about',     label: 'О СТУДИИ' },
    { path: '/services',  label: 'НАПРАВЛЕНИЯ' },
    { path: '/projects',  label: 'ПРАКТИКА' },
    { path: '/contact',   label: 'ОБСУДИТЬ' },
];

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const isModalOpen = useAppStore(s => s.isModalOpen);

    const activeIndex = ROUTES.findIndex(r =>
        r.path === '/' ? location.pathname === '/' : location.pathname.startsWith(r.path)
    );
    const currentLabel = activeIndex >= 0 ? ROUTES[activeIndex].label : '';

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-[120] flex justify-center pointer-events-none px-4 pt-4 md:pt-6 transition-all duration-700">
                <div className={`pointer-events-auto relative z-20 rounded-[2rem] md:w-auto border border-white/10 bg-black/40 backdrop-blur-xl px-6 md:px-12 py-3 md:py-4 flex justify-between items-center md:gap-16 shadow-2xl shadow-black/50 transition-all duration-700 ${isModalOpen ? 'w-[60%] md:max-w-none opacity-80 scale-95' : 'w-full scale-100 opacity-100'}`}>
                    
                    {/* Logo */}
                    <NavLink to="/" onClick={() => setIsMenuOpen(false)} className="group flex items-center shrink-0">
                        <span className="text-xl md:text-2xl font-bold tracking-[0.15em] text-white">КИМЭ</span>
                    </NavLink>

                    {/* Mobile section roadmap indicator */}
                    <div className="md:hidden flex items-center gap-1 mx-3 flex-1 justify-center overflow-hidden">
                        {ROUTES.filter(r => r.path !== '/').map((r, i) => {
                            const ri = ROUTES.findIndex(x => x.path === r.path);
                            const isActive = ri === activeIndex;
                            const isPast = ri < activeIndex;
                            return (
                                <React.Fragment key={r.path}>
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
                                        isActive ? 'bg-[#ffcc00] shadow-[0_0_6px_#ffcc00]' : isPast ? 'bg-white/40' : 'bg-white/15'
                                    }`} />
                                    {i < ROUTES.filter(r => r.path !== '/').length - 1 && (
                                        <div className={`h-px flex-1 max-w-[16px] transition-all duration-300 ${isPast ? 'bg-white/30' : 'bg-white/10'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {currentLabel && currentLabel !== 'ГЛАВНАЯ' && (
                            <span className="text-[7px] font-medium tracking-[0.2em] uppercase text-white/40 ml-2 shrink-0">{currentLabel}</span>
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-10">
                        <NavBarItem to="/about">О СТУДИИ</NavBarItem>
                        <NavBarItem to="/services">НАПРАВЛЕНИЯ</NavBarItem>
                        <NavBarItem to="/projects">ПРАКТИКА</NavBarItem>
                        <NavBarItem to="/contact">ОБСУДИТЬ</NavBarItem>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="md:hidden text-white/80 hover:text-white p-2 shrink-0 outline-none z-[130]"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu Overlay - Moved inside header for consistent z-stacking */}
                <AnimatePresence>
                    {isMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="fixed inset-0 z-[150] bg-[#050505]/95 backdrop-blur-3xl flex flex-col justify-center items-center pointer-events-auto"
                            >
                            <nav className="flex flex-col items-center gap-8 text-center">
                                <MobileNavItem to="/about" onClick={() => setIsMenuOpen(false)}>О СТУДИИ</MobileNavItem>
                                <MobileNavItem to="/services" onClick={() => setIsMenuOpen(false)}>НАПРАВЛЕНИЯ</MobileNavItem>
                                <MobileNavItem to="/projects" onClick={() => setIsMenuOpen(false)}>ПРАКТИКА</MobileNavItem>
                                <MobileNavItem to="/contact" onClick={() => setIsMenuOpen(false)}>ОБСУДИТЬ</MobileNavItem>
                            </nav>
                            
                            <div className="mt-20 flex gap-8 border-t border-white/10 pt-8 w-64 justify-center">
                                <a href="mailto:hello@kime.xyz" className="text-white/50 hover:text-white text-[10px] tracking-[0.3em] uppercase">Почта</a>
                                <a href="https://t.me/kime_bot" className="text-white/50 hover:text-white text-[10px] tracking-[0.3em] uppercase">Телеграм</a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>
        </>
    );
};

export default Header;
