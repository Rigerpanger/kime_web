import React, { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';

const LayoutInspector = () => {
    const [metrics, setMetrics] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
        ds: 0
    });

    useEffect(() => {
        const handleResize = () => {
            setMetrics(prev => ({
                ...prev,
                width: window.innerWidth,
                height: window.innerHeight,
                dpr: window.devicePixelRatio
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper to find distances to statue or center
    const [inspectorData, setInspectorData] = useState({});

    useEffect(() => {
        // Listen for custom events from overlays
        const handleMetricUpdate = (e) => {
            setInspectorData(prev => ({ ...prev, [e.detail.section]: e.detail.data }));
        };
        window.addEventListener('kime-metric-update', handleMetricUpdate);
        return () => window.removeEventListener('kime-metric-update', handleMetricUpdate);
    }, []);

    const ds = (metrics.width / 1280).toFixed(3);

    return (
        <div className="fixed top-24 right-6 z-[999999] w-72 bg-black/90 backdrop-blur-2xl border border-[#ffaa44]/50 rounded-2xl p-5 shadow-2xl pointer-events-auto font-mono text-white selection:bg-[#ffaa44]/30">
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <div className="w-2 h-2 rounded-full bg-[#ffaa44] animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#ffaa44]">TV Benchmarker</span>
            </div>

            <div className="space-y-4 text-[10px]">
                {/* Global Info */}
                <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                    <div>
                        <div className="text-white/40 mb-1">RESOLUTION</div>
                        <div className="font-bold">{metrics.width} x {metrics.height}</div>
                    </div>
                    <div>
                        <div className="text-white/40 mb-1">DPR</div>
                        <div className="font-bold">{metrics.dpr}</div>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-white/5">
                        <div className="text-[#ffaa44] mb-1 font-black">CURRENT SCALE (DS)</div>
                        <div className="text-lg font-black">{ds}x</div>
                    </div>
                </div>

                {/* Section Specific Info */}
                {Object.entries(inspectorData).map(([section, data]) => (
                    <div key={section} className="border-l-2 border-[#ffaa44] pl-3 py-1 animate-in fade-in slide-in-from-right-2">
                        <div className="text-[#ffaa44] font-black uppercase mb-2 tracking-tighter">{section}</div>
                        <div className="grid grid-cols-1 gap-1.5 opacity-90">
                            {Object.entries(data).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center bg-white/5 px-2 py-1 rounded">
                                    <span className="text-white/40 uppercase">{key}</span>
                                    <span className="font-bold text-white tracking-wider">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-[8px] text-white/40 uppercase text-center leading-relaxed">
                Сделайте скриншот этого окна на ТВ,<br />чтобы я применил эти параметры.
            </div>
        </div>
    );
};

export default LayoutInspector;
