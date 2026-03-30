import React from 'react';
import { Monitor, Smartphone, Video, Cuboid as Cube } from 'lucide-react';
import { motion } from 'framer-motion';

const services = [
    {
        icon: <Monitor size={40} className="text-neonBlue" />,
        title: "Web Development",
        description: "Modern, responsive websites and web applications built with the latest technologies."
    },
    {
        icon: <Cube size={40} className="text-neonPurple" />,
        title: "AR / VR",
        description: "Immersive augmented and virtual reality experiences for marketing and education."
    },
    {
        icon: <Video size={40} className="text-neonBlue" />,
        title: "Multimedia",
        description: "High-quality video production, motion graphics, and visual storytelling."
    },
    {
        icon: <Smartphone size={40} className="text-neonPurple" />,
        title: "Mobile Apps",
        description: "Native and cross-platform mobile applications that drive engagement."
    }
];

const Services = () => {
    return (
        <section id="services" className="py-20 bg-charcoal">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Our Services</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">We provided a wide range of digital solutions.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-obsidian/50 p-8 rounded-2xl border border-white/5 hover:border-neonBlue/50 transition-all hover:-translate-y-2"
                        >
                            <div className="mb-6 bg-charcoal w-16 h-16 rounded-xl flex items-center justify-center">
                                {service.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
