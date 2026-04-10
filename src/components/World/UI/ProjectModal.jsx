import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Box } from 'lucide-react';

const ProjectModal = ({ activeProject, onClose }) => {
    if (!activeProject) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 pointer-events-none">
            {/* Backdrop */}
            <m.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
            />

            {/* Modal Container */}
            <m.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl max-h-[90vh] bg-[#0c0c0c]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col overflow-hidden"
            >
                {/* Close Button - Always Visible */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 md:top-6 md:right-6 z-[10001] p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 hover:scale-110 transition-all duration-300 backdrop-blur-md"
                >
                    <X size={20} />
                </button>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                        
                        {/* LEFT SIDE: Media / Visuals */}
                        <div className="w-full lg:w-5/12 space-y-6">
                            <div className="aspect-video lg:aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-teal-500/20 opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Box size={48} className="text-white/10 group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                
                                <div className="absolute top-4 left-4">
                                    <span className="bg-indigo-600/80 backdrop-blur-md text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest border border-indigo-400/30">
                                        {activeProject.category || 'Featured'}
                                    </span>
                                </div>
                            </div>

                            <div className="hidden lg:grid grid-cols-2 gap-3 opacity-40">
                                <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                                <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
                            </div>
                        </div>

                        {/* RIGHT SIDE: Text Content */}
                        <div className="w-full lg:w-7/12 flex flex-col">
                            <div className="space-y-4 mb-8">
                                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white italic">
                                    {activeProject.title}
                                </h2>
                                <div className="h-1 w-24 bg-indigo-500 rounded-full" />
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffcc00] mb-3">Project Essence</h4>
                                    <p className="text-white/60 text-sm md:text-md leading-relaxed font-medium">
                                        {activeProject.description}
                                    </p>
                                </div>

                                {/* Dynamic Items */}
                                {activeProject.items && activeProject.items.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeProject.items.map((item, idx) => (
                                            <div key={item.id || idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.07] transition-all group cursor-default">
                                                <h5 className="text-white text-xs font-bold mb-1 group-hover:text-indigo-400 transition-colors uppercase tracking-wider">{item.title}</h5>
                                                {item.desc && <p className="text-white/30 text-[10px] leading-tight">{item.desc}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-4 pt-6">
                                    <button onClick={onClose} className="px-10 py-4 bg-white text-black font-black uppercase text-[11px] tracking-widest hover:bg-indigo-500 hover:text-white transition-all transform hover:-translate-y-1 shadow-xl">
                                        Close Sector
                                    </button>
                                    <button className="px-6 py-4 border border-white/10 text-white/40 font-black uppercase text-[11px] tracking-widest hover:border-white/40 hover:text-white transition-all flex items-center gap-2">
                                        Case Study <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Safe Inset Padding */}
                <div className="h-6 md:hidden w-full" />
            </m.div>
        </div>
    );
};

export default ProjectModal;
