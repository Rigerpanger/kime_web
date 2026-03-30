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
                >
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                        We Create <br />
                        <span className="bg-gradient-to-r from-neonBlue to-neonPurple bg-clip-text text-transparent">
                            Digital Reality
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Web • AR/VR • Multimedia. We fuse creativity and technology to build immersive experiences.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        <Button className="group">
                            Start a Project <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button variant="outline">
                            View Portfolio
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
