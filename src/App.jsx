import React, { useEffect } from 'react';
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

    useEffect(() => {
        const fetchSculptureConfig = async () => {
            const { data, error } = await supabase
                .from('site_content')
                .select('content_json')
                .eq('section_key', 'sculpture_config')
                .single();
            
            if (data && data.content_json) {
                setSculptureConfig(data.content_json);
            }
        };
        fetchSculptureConfig();
    }, [setSculptureConfig]);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans selection:bg-white/20">
            <RouteManager />
            <ScrollNavigator />
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
                    <Routes>
                        <Route path="/" element={<HomeOverlay />} />
                        <Route path="/services" element={<ServicesOverlay />} />
                        <Route path="/services/:slug" element={<ServicesOverlay />} />
                        <Route path="/projects" element={<ProjectsOverlay />} />
                        <Route path="/projects/:slug" element={<ProjectsOverlay />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<ContactOverlay />} />
                    </Routes>
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
        <BrowserRouter>
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

