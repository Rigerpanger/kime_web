/* [ignoring loop detection] */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CyberWaves = ({ config, modelY }) => {
    const active = config.active;
    const color = new THREE.Color(config.color || '#ffcc00');
    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const radius = config.radius || 5.0;

    const waveCount = 5;
    const wavesRef = useRef([]);

    const waves = useMemo(() => {
        return Array.from({ length: waveCount }).map((_, i) => ({
            phase: (i / waveCount)
        }));
    }, [waveCount]);

    useFrame((state) => {
        if (!active) return;
        const t = state.clock.elapsedTime * speed;
        const centerPos = config.height ?? modelY ?? 5.1;

        wavesRef.current.forEach((mesh, i) => {
            if (!mesh) return;
            const p = (waves[i].phase + t * 0.2) % 1;
            mesh.scale.setScalar(p * radius);
            mesh.material.opacity = (1 - p) * 0.5 * intensity;
            mesh.position.y = centerPos - 4; // Floor level
        });
    });

    if (!active) return null;

    return (
        <group>
            {waves.map((_, i) => (
                <mesh key={i} ref={el => wavesRef.current[i] = el} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.98, 1, 64]} />
                    <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </group>
    );
};

export default CyberWaves;
