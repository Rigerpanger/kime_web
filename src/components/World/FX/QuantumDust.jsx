/* [ignoring loop detection] */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const QuantumDust = ({ config, modelY }) => {
    const count = 1000;
    const radius = config.radius || 8.0;
    const color = new THREE.Color(config.color || '#ffffff');
    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;

    const pointsRef = useRef();

    const particles = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const vel = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * radius * 2;
            pos[i * 3 + 1] = (Math.random() - 0.5) * radius * 2;
            pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
            vel[i * 3] = (Math.random() - 0.5) * 0.02;
            vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        }
        return { pos, vel };
    }, [count, radius]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const posAttr = pointsRef.current.geometry.attributes.position;
        const centerPos = config.height ?? modelY ?? 5.1;
        pointsRef.current.position.y = centerPos;

        for (let i = 0; i < count; i++) {
            posAttr.array[i * 3] += particles.vel[i * 3] * speed;
            posAttr.array[i * 3 + 1] += particles.vel[i * 3 + 1] * speed + Math.sin(state.clock.elapsedTime + i) * 0.001;
            posAttr.array[i * 3 + 2] += particles.vel[i * 3 + 2] * speed;

            // Boundary check
            if (Math.abs(posAttr.array[i * 3]) > radius) posAttr.array[i * 3] *= -0.9;
            if (Math.abs(posAttr.array[i * 3 + 1]) > radius) posAttr.array[i * 3 + 1] *= -0.9;
            if (Math.abs(posAttr.array[i * 3 + 2]) > radius) posAttr.array[i * 3 + 2] *= -0.9;
        }
        posAttr.needsUpdate = true;
    });

    if (!config.active) return null;

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={particles.pos} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.02} color={color} transparent opacity={0.3 * intensity} sizeAttenuation={true} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
    );
};

export default QuantumDust;
