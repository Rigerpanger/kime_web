import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

// Fallback assets
import yamaguchi from '../../assets/logos/yamaguchi.svg';
import marsMedia from '../../assets/logos/mars-media.svg';
import vniight from '../../assets/logos/vniight.svg';
import stalingrad from '../../assets/logos/stalingrad.svg';
import soyuzmultfilm from '../../assets/logos/soyuzmultfilm.svg';

const fallbackPartners = [
  { name: 'yamaguchi', logo_url: yamaguchi, width: 160 },
  { name: 'marsMedia', logo_url: marsMedia, width: 140 },
  { name: 'vniight', logo_url: vniight, width: 150 },
  { name: 'stalingrad', logo_url: stalingrad, width: 180 },
  { name: 'soyuzmultfilm', logo_url: soyuzmultfilm, width: 170 }
];

const LogoTicker = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            const { data, error } = await supabase
                .from('partners')
                .select('*')
                .order('order_index', { ascending: true });
            
            if (!error && data && data.length > 0) {
                setPartners(data);
            } else {
                setPartners(fallbackPartners);
            }
            setLoading(false);
        };

        fetchPartners();
    }, []);

    if (loading) return <div className="h-[104px] w-full" />;

    // Ensure we have enough items for a continuous loop
    const tickerItems = partners.length > 0 
        ? [...partners, ...partners, ...partners, ...partners] 
        : [];

    return (
        <div className="h-[104px] py-2 overflow-hidden w-full opacity-60 hover:opacity-100 transition-opacity duration-500">
            <div className="relative flex overflow-x-hidden">
                <AnimatePresence>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, x: [0, -2000] }}
                        className="flex whitespace-nowrap gap-16 md:gap-32 items-center py-4"
                        transition={{ 
                            x: {
                                repeat: Infinity, 
                                duration: 40, 
                                ease: "linear" 
                            },
                            opacity: { duration: 1 }
                        }}
                    >
                        {tickerItems.map((partner, index) => (
                            <div 
                                key={`${partner.id || partner.name}-${index}`}
                                className="flex-shrink-0 flex items-center justify-center grayscale brightness-200 transform scale-[2.2] md:scale-100 origin-center mx-12 md:mx-0"
                            >
                                <img 
                                    src={partner.logo_url} 
                                    alt={partner.name} 
                                    style={{ width: partner.width || 160, height: 'auto' }}
                                    className="object-contain max-h-12 md:max-h-14"
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
