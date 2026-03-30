import React from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

const ProjectModal = ({ activeProject, onClose }) => {
    if (!activeProject) return null;

    return (
        <m.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-10 left-0 right-0 mx-auto w-full max-w-3xl p-6 pointer-events-none flex justify-center z-50"
        >
            <div className="bg-charcoal/80 backdrop-blur-xl p-8 rounded-2xl border border-neonBlue/30 shadow-[0_0_50px_-12px_rgba(0,243,255,0.3)] pointer-events-auto flex flex-col md:flex-row gap-8 w-full">
                {/* Media Section */}
                <div className="w-full md:w-1/3 aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/5 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-neonBlue/20 to-neonPurple/20 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-4xl font-bold">
                        {activeProject.type}
                    </div>
                </div>

                {/* Content Section */}
                <div className="w-full md:w-2/3 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-3xl font-bold text-white">{activeProject.title}</h3>
                        <span className="text-xs font-mono text-neonPurple border border-neonPurple/30 px-2 py-1 rounded">
                            {activeProject.category}
                        </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        {activeProject.description}
                    </p>

                    {/* Subulator Items */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {activeProject.items.map(item => (
                            <div key={item.id} className="bg-white/5 p-3 rounded hover:bg-white/10 transition-colors cursor-pointer border-l-2 border-neonBlue group">
                                <p className="text-white text-sm font-medium group-hover:text-neonBlue transition-colors">{item.title}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        className="self-start px-8 py-3 bg-white text-black font-bold rounded hover:bg-neonBlue hover:text-black transition-colors transform hover:scale-105 duration-200"
                        onClick={onClose}
                    >
                        CLOSE SECTOR
                    </button>
                </div>
            </div>
        </m.div>
    );
};

export default ProjectModal;
