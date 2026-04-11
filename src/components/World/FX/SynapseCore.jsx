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
        const count = 30; // Fewer lines for a cleaner look
        const pts = [];
        const lineIndices = [];
        
        // Force clamp radius to keep it inside the head
        const internalRadius = Math.min(0.4, radius);

        for (let i = 0; i < count; i++) {
            const r = Math.random() * internalRadius;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pts.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }

        // Connection logic (very selective/clean)
        for (let i = 0; i < count; i++) {
            let connections = 0;
            for (let j = i + 1; j < count; j++) {
                if (connections > 2) break; // Limit per-node density
                const dx = pts[i*3] - pts[j*3];
                const dy = pts[i*3+1] - pts[j*3+1];
                const dz = pts[i*3+2] - pts[j*3+2];
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (dist < internalRadius * 0.5) {
                    lineIndices.push(i, j);
                    connections++;
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
            const scale = 0.95 + Math.sin(t * 1.5) * 0.05;
            coreRef.current.scale.setScalar(scale * (config.scale || 1.0));
            coreRef.current.rotation.y += 0.01 * speed;
        }

        // Scanner Logic
        if (scannerRef.current) {
            scannerRef.current.position.y = Math.sin(t * 0.8) * 0.35;
            // Ghostly thin pulse
            scannerRef.current.material.opacity = Math.max(0, Math.sin(t * 0.8)) * 0.1 * intensity;
        }

        groupRef.current.rotation.y = t * 0.05;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* Neural Web (Lines) - Whispy and thin */}
            <lineSegments frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                    <bufferAttribute attach="index" count={lines.length} array={lines} itemSize={1} />
                </bufferGeometry>
                <lineBasicMaterial color={color} transparent opacity={Math.min(0.2, 0.2 * intensity)} blending={THREE.AdditiveBlending} depthWrite={false} />
            </lineSegments>

            {/* Neural Nodes (Points) - Tiny glimmering nodes */}
            <points frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.008} color={color} transparent opacity={Math.min(0.5, 0.5 * intensity)} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>

            {/* Pulsing Core */}
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[0.08, 1]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={0.1 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            {/* Scanning Laser/Disc */}
            <mesh ref={scannerRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.45, 0.001, 16, 64]} />
                <meshBasicMaterial color={color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            {/* Balanced Ambient Glow */}
            <pointLight intensity={0.5 * intensity} color={color} distance={1.2} />
        </group>
    );
};

export default SynapseCore;
