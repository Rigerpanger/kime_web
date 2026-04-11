import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SynapseCore = ({ config, modelY }) => {
    const groupRef = useRef();
    const coreRef = useRef();
    const signalsRef = useRef();

    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const radius = config.radius || 0.35;
    const heightOffset = config.height || 0;
    const depthOffset = config.depth || 0;

    // --- CURVE GENERATION (The Tracks) ---
    const { curves, trackPositions } = useMemo(() => {
        const lineCount = 15;
        const segmentsPerLine = 30;
        const allCurves = [];
        const pos = new Float32Array(lineCount * segmentsPerLine * 3);

        const r_int = radius * 0.3;
        const r_ext = radius;

        for (let i = 0; i < lineCount; i++) {
            const p1 = new THREE.Vector3().setFromSphericalCoords(Math.random() * r_int, Math.random() * Math.PI, Math.random() * Math.PI * 2);
            const p2 = new THREE.Vector3().setFromSphericalCoords(r_ext, Math.random() * Math.PI, Math.random() * Math.PI * 2);
            const pControl = new THREE.Vector3().lerpVectors(p1, p2, 0.5).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(radius * 0.8)
            );

            const curve = new THREE.QuadraticBezierCurve3(p1, pControl, p2);
            allCurves.push(curve);

            const points = curve.getPoints(segmentsPerLine - 1);
            for (let j = 0; j < segmentsPerLine; j++) {
                const idx = (i * segmentsPerLine + j);
                pos[idx * 3] = points[j].x;
                pos[idx * 3 + 1] = points[j].y;
                pos[idx * 3 + 2] = points[j].z;
            }
        }
        return { curves: allCurves, trackPositions: pos };
    }, [radius]);

    // --- PULSE DATA (Petrol Signals) ---
    const signals = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            curveIndex: i % curves.length,
            progress: Math.random(),
            speed: (0.15 + Math.random() * 0.3) * speed,
            offset: Math.random() * Math.PI * 2
        }));
    }, [curves, speed]);

    const signalPos = useMemo(() => new Float32Array(signals.length * 3), [signals]);
    const signalColors = useMemo(() => new Float32Array(signals.length * 3), [signals]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        
        // 3D Centering (X, Y, Z)
        groupRef.current.position.y = modelY + heightOffset;
        groupRef.current.position.z = depthOffset;

        // Core Pulse
        if (coreRef.current) {
            const s = 0.98 + Math.sin(t * 1.5) * 0.02;
            coreRef.current.scale.setScalar(s * (config.scale || 1.0));
            coreRef.current.rotation.y = t * 0.1;
        }

        // Update Petrol Signals
        if (signalsRef.current) {
            const posAttr = signalsRef.current.geometry.attributes.position;
            const colorAttr = signalsRef.current.geometry.attributes.color;
            
            signals.forEach((sig, i) => {
                sig.progress = (sig.progress + sig.speed * 0.02) % 1.0;
                const point = curves[sig.curveIndex].getPointAt(sig.progress);
                
                posAttr.array[i * 3] = point.x;
                posAttr.array[i * 3 + 1] = point.y;
                posAttr.array[i * 3 + 2] = point.z;

                // --- PETROL IRIDESCENCE FORMULA ---
                // Shifting through Indigo, Magenta, Cyan, Emerald
                const colT = t * 0.5 + sig.offset;
                const r = 0.5 + 0.5 * Math.cos(colT + 0);
                const g = 0.5 + 0.5 * Math.cos(colT + 2);
                const b = 0.5 + 0.5 * Math.cos(colT + 4);
                
                colorAttr.array[i * 3] = r;
                colorAttr.array[i * 3 + 1] = g;
                colorAttr.array[i * 3 + 2] = b;
            });

            posAttr.needsUpdate = true;
            colorAttr.needsUpdate = true;
        }

        groupRef.current.rotation.y = t * 0.03;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* The Invisible Neural Tracks (Faint Arcs) */}
            <lineSegments frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={trackPositions.length / 3} array={trackPositions} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color={config.color || '#00f2ff'} transparent opacity={0.1 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </lineSegments>

            {/* PETROL SIGNALS (Moving pulses) */}
            <points ref={signalsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={signals.length} array={signalPos} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={signals.length} array={signalColors} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.03} vertexColors transparent opacity={0.8 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>

            {/* Neural Heart (Intense Core) */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color={config.color || '#00f2ff'} transparent opacity={0.3 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
                {/* Outer Glow Sphere */}
                <mesh scale={1.8}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial color={config.color || '#00f2ff'} wireframe transparent opacity={0.1 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            </mesh>

            <pointLight intensity={0.5 * intensity} color={config.color || '#00f2ff'} distance={1.2} />
        </group>
    );
};

export default SynapseCore;
