import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Scene from './components/World/Scene';
import Header from './components/Layout/Header';
import RouteManager from './components/Layout/RouteManager';
import { supabase } from './lib/supabase';

import ScrollNavigator from './components/Layout/ScrollNavigator';
import StudioEditor from './components/World/StudioEditor';

import HomeOverlay from './components/Sections/HomeOverlay';
import ServicesOverlay from './components/Sections/ServicesOverlay';
import ProjectsOverlay from './components/Sections/ProjectsOverlay';
import About from './components/Sections/About';
import ContactOverlay from './components/Sections/ContactOverlay';
import MobileScrollStack from './components/Layout/MobileScrollStack';

import Login from './components/Admin/Login';
import Dashboard from './components/Admin/Dashboard';
import ManageProjects from './components/Admin/ManageProjects';
import ManageAbout from './components/Admin/ManageAbout';
import Settings from './components/Admin/Settings';
import ProtectedRoute from './components/Admin/ProtectedRoute';


import useAppStore from './store/useAppStore';
import useAuthStore from './store/useAuthStore';



const AppLayout = () => {
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    useEffect(() => {
        const handleError = (event) => {
            useAppStore.getState().setDebug({ lastError: event.message || 'Unknown Error' });
        };
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    const setHoveredChunk = useAppStore(s => s.setHoveredChunk);
    const setSculptureConfig = useAppStore(s => s.setSculptureConfig);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // NUCLEAR SANITIZE: Fix poisoned localStorage data on start
        const config = useAppStore.getState().sculptureConfig;
        const isPoisoned = 
            !Number.isFinite(Number(config.scale)) || 
            !Number.isFinite(Number(config.y)) ||
            !Number.isFinite(Number(config.rotationY));
            
        if (isPoisoned) {
            console.warn("Poisoned state detected in localStorage. Forcing recovery...");
            useAppStore.setState({ 
                sculptureConfig: { 
                    ...config, 
                    scale: 17.0, 
                    y: 5.1, 
                    rotationY: 248 
                } 
            });
        }
    }, []);

    useEffect(() => {
        const fetchSculptureConfig = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const response = await fetch(`${apiUrl}/content/sculpture_config`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && Object.keys(data).length > 0) {
                        // SANITIZATION: Clean up any NaN/null that might have leaked into the DB or memory
                        const clean = { ...data };
                        if (!Number.isFinite(Number(clean.scale))) clean.scale = 17.0;
                        if (!Number.isFinite(Number(clean.y))) clean.y = 5.1;
                        if (!Number.isFinite(Number(clean.rotationY))) clean.rotationY = 248;
                        setSculptureConfig(clean);
                    }
                } else {
                    console.log("DB config not found, using AppStore persistent default.");
                }
            } catch (err) {
                console.error("Failed to load sculpture config", err);
            }
        };
        fetchSculptureConfig();
    }, [setSculptureConfig]);

    const isScrollLocked = useAppStore(s => s.isScrollLocked);

    useEffect(() => {
        if (isScrollLocked) {
            document.body.style.overflow = 'hidden';
            // Prevent scrolling on iOS devices specifically
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isScrollLocked]);

    // FETCH GLOBAL LAYOUT (For showStudioEditor state)
    useEffect(() => {
        const fetchGlobalLayout = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const response = await fetch(`${apiUrl}/content/global_layout`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.showStudioEditor !== undefined) {
                        setShowStudioEditor(data.showStudioEditor);
                    }
                }
            } catch (err) {
                console.error("Failed to load global layout settings", err);
            }
        };
        fetchGlobalLayout();
    }, [setShowStudioEditor]);

    const user = useAuthStore(s => s.user);
    const setShowStudioEditor = useAppStore(s => s.setShowStudioEditor);

    const loadingAuth = useAuthStore(s => s.loading);

    // Maintenance Mode Logic:
    // If showStudioEditor is enabled globally, we show a login overlay for non-authorized users.
    const isMaintenanceMode = showStudioEditor && !user && !loadingAuth;

    return (
        <div className="relative w-full min-h-screen bg-black font-sans selection:bg-white/20">
            {isMaintenanceMode && <MaintenanceOverlay />}
            <RouteManager />
            {!isMobile && <ScrollNavigator />}
            {showStudioEditor && user && <StudioEditor />}

            {/* 1. Persistent 3D Layer */}
            <div className="absolute inset-0 z-0">
                <Scene />
            </div>

            {/* 2. UI Layer (Glass Overlay) */}
            <div className="absolute inset-0 z-10 pointer-events-none overflow-y-auto">
                <main className="pointer-events-auto min-h-screen">
                    {isMobile ? (
                        <MobileScrollStack />
                    ) : (
                        <Routes>
                            <Route path="/" element={<HomeOverlay />} />
                            <Route path="/services" element={<ServicesOverlay />} />
                            <Route path="/services/:slug" element={<ServicesOverlay />} />
                            <Route path="/projects" element={<ProjectsOverlay />} />
                            <Route path="/projects/:slug" element={<ProjectsOverlay />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/about/:slug" element={<About />} />
                            <Route path="/contact" element={<ContactOverlay />} />
                        </Routes>
                    )}
                </main>

                <div className="pointer-events-auto">
                    <Header />
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const initializeAuth = useAuthStore(state => state.initializeAuth);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                {/* Admin Routes */}
                <Route path="/admin/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<Dashboard />} />
                    <Route path="/admin/projects" element={<ManageProjects />} />
                    <Route path="/admin/about" element={<ManageAbout />} />
                    <Route path="/admin/settings" element={<Settings />} />
                </Route>

                {/* Main Site Routes */}
                <Route path="/*" element={<AppLayout />} />
            </Routes>
        </BrowserRouter>
    );
};

const MaintenanceOverlay = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const signIn = useAuthStore(state => state.signIn);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signIn(email, password);
        } catch (err) {
            setError(err.message || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black p-4">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ backgroundSize: '30px 30px', backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)' }} 
            />
            
            <div className="w-full max-w-md bg-[#080808] border border-white/5 p-10 rounded-[2rem] shadow-2xl backdrop-blur-3xl relative z-10 transition-all">
                <div className="mb-10 text-center">
                    <h1 className="text-xl font-thin tracking-[0.4em] uppercase text-white mb-4">
                        KIME <span className="text-indigo-500 font-normal">STUDIO</span>
                    </h1>
                    <div className="h-px w-12 bg-indigo-500 mx-auto mb-6" />
                    <h2 className="text-white text-lg font-bold mb-2">Мы делаем сайт лучше</h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">
                        Режим технического обслуживания
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[9px] uppercase tracking-[0.3em] text-gray-400 px-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                            placeholder="admin@kime.pro"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[9px] uppercase tracking-[0.3em] text-gray-400 px-1">
                            Пароль
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/5 border border-red-500/20 text-red-400 text-[9px] uppercase tracking-widest p-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 text-white text-[10px] uppercase tracking-[0.3em] font-black py-5 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <p className="mt-10 text-center text-[8px] text-white/20 uppercase tracking-[0.5em]">
                    © 2026 KIME DIGITAL AGENCY
                </p>
            </div>
        </div>
    );
};

export default App;

