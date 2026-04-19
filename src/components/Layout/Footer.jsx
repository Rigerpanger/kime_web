import React from 'react';
import { Instagram, Globe, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <>
            <footer className="bg-charcoal border-t border-white/5 py-12">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-6 md:mb-0">
                        <h3 className="text-2xl font-bold text-white mb-2">KIME</h3>
                        <p className="text-gray-500 text-sm">© 2025 Kime Production. All rights reserved.</p>
                    </div>

                    <div className="flex space-x-6">
                        <a href="#" className="text-gray-400 hover:text-neonPurple transition-colors">
                            <Instagram size={24} />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-neonBlue transition-colors">
                            <Globe size={24} />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">
                            <Mail size={24} />
                        </a>
                    </div>
                </div>
            </footer>
            <div className="fixed bottom-0 left-0 z-[9999] bg-black/90 text-[11px] text-[#ffaa44] px-3 py-1 pointer-events-none font-mono border-t border-r border-white/10 uppercase tracking-widest leading-none">
                TV Specs: W: {window.innerWidth}px | H: {window.innerHeight}px | DPR: {window.devicePixelRatio}
            </div>
        </>
    );
};

export default Footer;
