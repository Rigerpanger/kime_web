import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

const MuseumRoom = () => {
    // --- Procedural Stone/Concrete Texture Generator ---
    // This creates a grain/noise texture in-memory to keep it lightweight (0kb download)
    const concreteTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base color
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add Grain
        for (let i = 0; i < 20000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 1.5;
            const opacity = Math.random() * 0.15;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.fillRect(x, y, size, size);
        }
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
        return tex;
    }, []);

    const floorLevel = 5.1; // Matches sculpture base in useAppStore

    return (
        <group position={[0, floorLevel, 0]}>
            {/* --- Floor --- */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial 
                    color="#222222"
                    map={concreteTexture}
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* --- Back Wall (Extreme distance for Grand Hall feel) --- */}
            <mesh position={[0, 100, -60]} receiveShadow>
                <planeGeometry args={[1000, 500]} />
                <meshStandardMaterial 
                    color="#151515"
                    map={concreteTexture}
                    roughness={0.9}
                    metalness={0.0}
                />
            </mesh>

            {/* --- Left Wall (Extreme distance for Grand Hall feel) --- */}
            <mesh position={[-50, 100, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <planeGeometry args={[1000, 500]} />
                <meshStandardMaterial 
                    color="#121212"
                    map={concreteTexture}
                    roughness={0.9}
                    metalness={0.0}
                />
            </mesh>

            {/* --- Base Detail (Shadow line/Wall Trim - Clear Anchor) --- */}
            <mesh position={[0, 0.15, -59.9]} receiveShadow>
                <boxGeometry args={[100, 0.3, 0.3]} />
                <meshStandardMaterial color="#050505" />
            </mesh>
            <mesh position={[-49.9, 0.15, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[100, 0.3, 0.3]} />
                <meshStandardMaterial color="#050505" />
            </mesh>
        </group>
    );
};

export default MuseumRoom;
