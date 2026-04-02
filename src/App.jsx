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
import ProtectedRoute from './components/Admin/ProtectedRoute';


import useAppStore from './store/useAppStore';
import useAuthStore from './store/useAuthStore';



const AppLayout = () => {
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const setSculptureConfig = useAppStore(s => s.setSculptureConfig);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchSculptureConfig = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const response = await fetch(`${apiUrl}/content/sculpture_config`);
                if (response.ok) {
                    const data = await response.json();
                    if (data) setSculptureConfig(data);
                } else {
                    console.log("Using default config (empty DB)");
                    setSculptureConfig({
                         modelPath: "/models/sculpture.glb",
                         scale: 1, 
                         position: [0,-1,0],
                         rotation: [0,0,0],
                         color: "#333333",
                         metalness: 0.9,
                         roughness: 0.1
                    });
                }
            } catch (err) {
                console.error("Failed to load sculpture config", err);
                setSculptureConfig({ modelPath: "/models/sculpture.glb", scale: 1 });
            }
        };
        fetchSculptureConfig();
    }, [setSculptureConfig]);

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
                <div className="pointer-events-auto">
                    <Header />
                </div>

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
                            <Route path="/contact" element={<ContactOverlay />} />
                        </Routes>
                    )}
                </main>
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
                    <Route path="/admin/services" element={<Dashboard />} /> {/* Placeholder */}
                    <Route path="/admin/settings" element={<Dashboard />} /> {/* Placeholder */}
                </Route>

                {/* Main Site Routes */}
                <Route path="/*" element={<AppLayout />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;

