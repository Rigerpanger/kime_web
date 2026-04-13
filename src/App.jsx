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

    const user = useAuthStore(s => s.user);
    const setShowStudioEditor = useAppStore(s => s.setShowStudioEditor);

    const loadingAuth = useAuthStore(s => s.loading);

    useEffect(() => {
        // Safety: If we're on production and not logged in as admin, force turn off the editor
        // but only after auth initialization is complete
        const isLocalhost = window.location.hostname === 'localhost';
        
        if (!isLocalhost && !loadingAuth && user?.role !== 'admin' && showStudioEditor) {
            setShowStudioEditor(false);
        }
    }, [user, loadingAuth, showStudioEditor, setShowStudioEditor]);

    return (
        <div className="relative w-full min-h-screen bg-black font-sans selection:bg-white/20">
            <RouteManager />
            {!isMobile && <ScrollNavigator />}
            {showStudioEditor && <StudioEditor />}

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

export default App;

