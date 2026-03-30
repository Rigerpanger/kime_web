import React from 'react';
import Scene from './Scene';

const Map = () => {
    return (
        <section className="h-screen w-full relative bg-[#050505] overflow-hidden">
            {/* 3D Scene Background */}
            <div className="absolute inset-0 z-0">
                <Scene />
            </div>

            {/* UI Overlay Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-12">

                {/* Header Area */}
                <div className="text-center mt-10">
                    <h1 className="text-6xl md:text-8xl font-bold text-white tracking-widest mb-4">KIME</h1>
                    <p className="text-gray-400 text-xl tracking-wider uppercase font-light">
                        Museum of Digital Experiences
                    </p>
                </div>

                {/* Right Side Menu (Services) */}
                <div className="absolute top-1/2 right-12 transform -translate-y-1/2 flex flex-col items-end gap-6 pointer-events-auto">
                    {['CGI', 'AR/VR', 'Interactive', 'AI & Software'].map((item) => (
                        <div key={item} className="group cursor-pointer">
                            <span className="text-gray-500 text-2xl group-hover:text-white transition-colors duration-300 font-light">
                                {item}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Footer / CTA Area */}
                <div className="flex justify-center gap-8 mb-10 pointer-events-auto">
                    <button className="px-8 py-3 border border-gray-600 text-gray-300 rounded-full hover:border-white hover:text-white transition-all uppercase text-sm tracking-widest">
                        View selected works
                    </button>
                    <button className="px-8 py-3 border border-gray-600 text-gray-300 rounded-full hover:border-white hover:text-white transition-all uppercase text-sm tracking-widest">
                        Start a project
                    </button>
                </div>

                {/* Plaque Label (3D Logic is in MuseumPiece, this is just overlay if needed, currently unused) */}
            </div>
        </section>
    );
};

export default Map;
