import React from 'react';
import { Instagram, Globe, Mail } from 'lucide-react';

const Footer = () => {
    return (
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
    );
};

export default Footer;
