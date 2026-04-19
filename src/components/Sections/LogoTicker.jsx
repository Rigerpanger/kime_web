import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fallbackPartners = [
  { name: 'yamaguchi', logo_url: '/assets/logos/yamaguchi.svg', width: 140 },
  { name: 'marsMedia', logo_url: '/assets/logos/mars-media.svg', width: 120 },
  { name: 'vniight', logo_url: '/assets/logos/vniight.svg', width: 130 },
  { name: 'stalingrad', logo_url: '/assets/logos/stalingrad.svg', width: 160 },
  { name: 'soyuzmultfilm', logo_url: '/assets/logos/soyuzmultfilm.svg', width: 150 }
];

const LogoTicker = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const response = await fetch(`${apiUrl}/partners`);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setPartners(data);
                    } else {
                        setPartners(fallbackPartners);
                    }
                } else {
                    setPartners(fallbackPartners);
                }
            } catch (error) {
                console.error('Error fetching partners:', error);
                setPartners(fallbackPartners);
            } finally {
                setLoading(false);
            }
        };

        fetchPartners();
    }, []);

    if (loading) return <div className="h-[80px] w-full" />;

    // Use a large enough repeat count for seamless loop
    const tickerItems = partners.length > 0 
        ? [...partners, ...partners, ...partners, ...partners, ...partners, ...partners] 
        : [];

    return (
        <div className="h-[80px] py-1 overflow-hidden w-full opacity-60 hover:opacity-100 transition-opacity duration-500">
            <div className="relative flex h-full items-center overflow-x-hidden">
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, x: [0, -2500] }}
                        className="flex whitespace-nowrap gap-28 items-center"
                        transition={{ 
                            x: {
                                repeat: Infinity, 
                                duration: 30, 
                                ease: "linear" 
                            },
                            opacity: { duration: 1 }
                        }}
                    >
                        {tickerItems.map((partner, index) => (
                            <div 
                                key={`${partner.id || partner.name}-${index}`}
                                className="flex-shrink-0 flex items-center justify-center grayscale brightness-200 px-4"
                            >
                                <img 
                                    src={partner.logo_url} 
                                    alt={partner.name} 
                                    className="object-contain w-[160px] max-h-12"
                                />
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LogoTicker;
