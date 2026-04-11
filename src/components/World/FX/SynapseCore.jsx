import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SynapseCore = ({ config, modelY }) => {
    const groupRef = useRef();
    const coreRef = useRef();
    const scannerRef = useRef();

    const color = new THREE.Color(config.color || '#00f2ff');
    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const radius = config.radius || 0.4; // Tight for head
    const heightOffset = config.height || 0;

    // --- NEURAL WEB GENERATION ---
    const { positions, lines } = useMemo(() => {
        const count = 40;
        const pts = [];
        const lineIndices = [];
        
        // Random points within a sphere
        for (let i = 0; i < count; i++) {
            const r = Math.random() * radius;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pts.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }

        // Connection logic (nearest neighbors)
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                const dx = pts[i*3] - pts[j*3];
                const dy = pts[i*3+1] - pts[j*3+1];
                const dz = pts[i*3+2] - pts[j*3+2];
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (dist < radius * 0.6) {
                    lineIndices.push(i, j);
                }
            }
        }

        return { 
            positions: new Float32Array(pts), 
            lines: new Uint16Array(lineIndices) 
        };
    }, [radius]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime * speed;
        
        // Final position (Inside head)
        groupRef.current.position.y = modelY + heightOffset;

        // Core Breathing
        if (coreRef.current) {
            const scale = 0.9 + Math.sin(t * 1.5) * 0.1;
            coreRef.current.scale.setScalar(scale);
            coreRef.current.rotation.y += 0.01 * speed;
        }

        // Scanner Logic
        if (scannerRef.current) {
            // Moves up and down rhythmically
            scannerRef.current.position.y = Math.sin(t * 0.8) * radius;
            scannerRef.current.material.opacity = (Math.sin(t * 0.8) + 1.0) * 0.5 * intensity;
        }

        // Subtle group rotation
        groupRef.current.rotation.y = t * 0.1;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* Neural Web (Lines) */}
            <lineSegments frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                    <bufferAttribute attach="index" count={lines.length} array={lines} itemSize={1} />
                </bufferGeometry>
                <lineBasicMaterial color={color} transparent opacity={0.4 * intensity} linewidth={1} blending={THREE.AdditiveBlending} />
            </lineSegments>

            {/* Neural Nodes (Points) */}
            <points frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.015} color={color} transparent opacity={0.8 * intensity} blending={THREE.AdditiveBlending} />
            </points>

            {/* Pulsing Core */}
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[radius * 0.3, 1]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={0.3 * intensity} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Scanning Laser/Disc */}
            <mesh ref={scannerRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius * 1.2, 0.005, 16, 64]} />
                <meshBasicMaterial color={color} transparent opacity={0} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Soft Ambient Core Glow */}
            <pointLight intensity={2 * intensity} color={color} distance={radius * 5} />
        </group>
    );
};

export default SynapseCore;
