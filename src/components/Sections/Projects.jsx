import React from 'react';
import { motion } from 'framer-motion';

const projects = [
    {
        id: 1,
        title: "Neon Cyber",
        category: "Web Design",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 2,
        title: "Virtual Museum",
        category: "AR / VR",
        image: "https://images.unsplash.com/photo-1622979135225-d2ba269fb1ac?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 3,
        title: "Tech Promo",
        category: "Video",
        image: "https://images.unsplash.com/photo-1535016120720-40c6874c3b1d?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 4,
        title: "Smart App",
        category: "Mobile",
        image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=800"
    }
];

const Projects = () => {
    return (
        <section id="projects" className="py-20 bg-obsidian">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-between items-end mb-16"
                >
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Featured Projects</h2>
                        <p className="text-gray-400">Highlights of our best work.</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative overflow-hidden rounded-2xl aspect-video cursor-pointer"
                        >
                            <img
                                src={project.image}
                                alt={project.title}
                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                                <span className="text-neonBlue text-sm font-medium mb-2">{project.category}</span>
                                <h3 className="text-2xl font-bold">{project.title}</h3>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Projects;
