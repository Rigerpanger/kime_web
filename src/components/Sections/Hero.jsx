import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { motion } from 'framer-motion';
import Button from '../UI/Button';
import { ArrowRight } from 'lucide-react';

const AnimatedSphere = () => {
    return (
        <Sphere visible args={[1, 100, 200]} scale={2}>
            <MeshDistortMaterial
                color="#bc13fe"
                attach="material"
                distort={0.4}
                speed={1.5}
                roughness={0.2}
            />
        </Sphere>
    );
};

const Hero = () => {
    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-charcoal to-obsidian z-0" />

            {/* 3D Canvas */}
            <div className="absolute inset-0 opacity-40 z-10 pointer-events-none md:pointer-events-auto">
                <Canvas>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <AnimatedSphere />
                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                </Canvas>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 relative z-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="md:bg-transparent bg-black/30 backdrop-blur-md md:backdrop-blur-none p-8 md:p-0 rounded-3xl border border-white/10 md:border-none shadow-2xl md:shadow-none"
                >
                    <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight text-white leading-tight">
                        Создаем <br />
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            Цифровую Реальность
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-light">
                        Web • AR/VR • Multimedia. Мы объединяем креатив и технологии для создания иммерсивного опыта.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Button className="group bg-[#ffcc00] text-black border-none hover:bg-[#ffaa00]">
                            Начать проект <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
                            Портфолио
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
