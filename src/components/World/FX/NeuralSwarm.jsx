/* [ignoring loop detection] */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NeuralSwarm = ({ config, modelY }) => {
    const count = Math.min(5000, config.density || 1500);
    const radius = config.radius || 3.5;
    const speed = config.speed || 1.0;
    const size = (config.scale || 1.0) * 0.05;
    const color = new THREE.Color(config.color || '#00f2ff');
    const behavior = config.behavior || 'Orbit';

    const pointsRef = useRef();

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = radius * (0.5 + Math.random() * 1.5);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    }, [count, radius]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const t = state.clock.elapsedTime * speed;
        const centerPos = config.height ?? modelY ?? 5.1;
        pointsRef.current.position.y = centerPos;
        
        // NEW: Real-time rotation and size reaction
        pointsRef.current.rotation.y = (config.azimuth || 0) * (Math.PI / 180);
        pointsRef.current.material.size = size * (config.intensity || 1.0);
        pointsRef.current.material.opacity = 0.6 * (config.intensity || 1.0);

        const posAttr = pointsRef.current.geometry.attributes.position;
        
        for (let i = 0; i < count; i++) {
            const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
            let x = posAttr.array[ix];
            let y = posAttr.array[iy];
            let z = posAttr.array[iz];

            if (behavior === 'Orbit') {
                const angle = 0.01 * speed;
                const cos = Math.cos(angle), sin = Math.sin(angle);
                const nx = x * cos - z * sin;
                const nz = x * sin + z * cos;
                posAttr.array[ix] = nx;
                posAttr.array[iz] = nz;
                posAttr.array[iy] += Math.sin(t + i * 0.1) * 0.002;
            } else if (behavior === 'Chaos') {
                posAttr.array[ix] += (Math.random() - 0.5) * 0.02 * speed;
                posAttr.array[iy] += (Math.random() - 0.5) * 0.02 * speed;
                posAttr.array[iz] += (Math.random() - 0.5) * 0.02 * speed;
            } else {
                posAttr.array[iy] += 0.01 * speed;
                if (posAttr.array[iy] > radius * 2) posAttr.array[iy] = -radius * 2;
                posAttr.array[ix] += Math.sin(t + y) * 0.005;
                posAttr.array[iz] += Math.cos(t + y) * 0.005;
            }
            
            // NEW: Real-time Radius response (clamping pos to radius)
            const dist = Math.sqrt(posAttr.array[ix]**2 + posAttr.array[iy]**2 + posAttr.array[iz]**2);
            if (dist > radius) {
                posAttr.array[ix] *= (radius / dist);
                posAttr.array[iy] *= (radius / dist);
                posAttr.array[iz] *= (radius / dist);
            }
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={particles} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={size} color={color} transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
};

export default NeuralSwarm;
