import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Procedurally generate textures for the planet (Color + Bump)
const generatePlanetTextures = () => {
    const width = 1024; // Higher res
    const height = 1024;

    const canvasColor = document.createElement('canvas');
    canvasColor.width = width;
    canvasColor.height = height;
    const ctxColor = canvasColor.getContext('2d');

    const canvasBump = document.createElement('canvas');
    canvasBump.width = width;
    canvasBump.height = height;
    const ctxBump = canvasBump.getContext('2d');

    // 1. Base Layers
    // Color: Rich Royal Blue Ocean (Not too dark)
    ctxColor.fillStyle = '#1e88e5';
    ctxColor.fillRect(0, 0, width, height);

    // Bump: Black (Sea level)
    ctxBump.fillStyle = '#101010';
    ctxBump.fillRect(0, 0, width, height);

    // 2. Continents Generation
    const numContinents = 12;

    const drawBlob = (x, y, radius) => {
        // --- Color Map ---
        // Soft gradient for land
        const gradC = ctxColor.createRadialGradient(x, y, 0, x, y, radius);
        gradC.addColorStop(0, '#66bb6a'); // Light Green center
        gradC.addColorStop(0.7, '#43a047'); // Green edges
        gradC.addColorStop(1, '#1e88e5'); // Fade to sea

        ctxColor.beginPath();
        ctxColor.arc(x, y, radius, 0, Math.PI * 2);
        ctxColor.fillStyle = gradC;
        ctxColor.fill();

        // --- Bump Map ---
        // Soft slopes
        const gradB = ctxBump.createRadialGradient(x, y, 0, x, y, radius);
        gradB.addColorStop(0, '#aaaaaa'); // High
        gradB.addColorStop(0.5, '#606060'); // Mid
        gradB.addColorStop(1, '#101010');   // Sea level

        ctxBump.beginPath();
        ctxBump.arc(x, y, radius, 0, Math.PI * 2);
        ctxBump.fillStyle = gradB;
        ctxBump.fill();
    };

    for (let i = 0; i < numContinents; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 80 + Math.random() * 100;
        drawBlob(x, y, radius);
    }

    return {
        map: new THREE.CanvasTexture(canvasColor),
        bumpMap: new THREE.CanvasTexture(canvasBump)
    };
};

const Globe = () => {
    const cloudsRef = useRef();
    const globeRef = useRef();

    // Generate textures once
    const { map, bumpMap } = useMemo(() => generatePlanetTextures(), []);

    useFrame((state, delta) => {
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * 0.02;
        }
        if (globeRef.current) {
            globeRef.current.rotation.y += delta * 0.005;
        }
    });

    return (
        <group>
            {/* The Main Planet */}
            <Sphere args={[9.8, 128, 128]} ref={globeRef}>
                <meshStandardMaterial
                    map={map}
                    bumpMap={bumpMap}
                    bumpScale={0.15} // Reduced bump to avoid artifacts
                    roughness={0.6} // Less plastic, more matte/natural
                    metalness={0.1}
                />
            </Sphere>

            {/* Cloud Layer (Subtle) */}
            <group ref={cloudsRef}>
                <Sphere args={[10.05, 64, 64]}>
                    <meshStandardMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.15}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </Sphere>
            </group>

            {/* Atmosphere Glow */}
            <Sphere args={[10.3, 32, 32]}>
                <meshBasicMaterial
                    color="#90caf9"
                    transparent
                    opacity={0.1}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </Sphere>
        </group>
    );
};

export default Globe;
