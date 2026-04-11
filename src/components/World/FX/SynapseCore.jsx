import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SynapseCore = ({ config, modelY }) => {
    const groupRef = useRef();
    const signalsRef = useRef();

    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const radius = config.radius || 0.45;
    const heightOffset = config.height || 0;
    const depthOffset = config.depth || 0;

    // --- RECURSIVE SYNAPTIC TREE GENERATION (V4) ---
    const { curves, treePositions } = useMemo(() => {
        const branchCount = 8;
        const subBranchCount = 3;
        const segmentsPerCurve = 35;
        const allCurves = [];
        const posArray = [];

        // Roots at center
        const center = new THREE.Vector3(0, 0, 0);

        for (let i = 0; i < branchCount; i++) {
            // Main branch endpoint
            const target = new THREE.Vector3().setFromSphericalCoords(
                radius * (0.8 + Math.random() * 0.4),
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2
            );

            // Create curved main branch
            const mid = center.clone().lerp(target, 0.5).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(radius * 0.5)
            );
            const mainCurve = new THREE.CatmullRomCurve3([center, mid, target]);
            allCurves.push(mainCurve);

            // Generate sub-branches splitting from the main one
            for (let s = 0; s < subBranchCount; s++) {
                const splitFactor = 0.3 + Math.random() * 0.4;
                const splitPoint = mainCurve.getPoint(splitFactor);
                
                const subTarget = new THREE.Vector3().setFromSphericalCoords(
                    radius * 1.2,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI * 2
                );
                
                const subMid = splitPoint.clone().lerp(subTarget, 0.5).add(
                    new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(radius * 0.3)
                );
                
                const subCurve = new THREE.CatmullRomCurve3([splitPoint, subMid, subTarget]);
                allCurves.push(subCurve);
            }
        }

        // Convert all curves to points for background rendering
        allCurves.forEach(curve => {
            const pts = curve.getPoints(segmentsPerCurve);
            for (let j = 0; j < pts.length - 1; j++) {
                posArray.push(pts[j].x, pts[j].y, pts[j].z);
                posArray.push(pts[j+1].x, pts[j+1].y, pts[j+1].z);
            }
        });

        return { 
            curves: allCurves, 
            treePositions: new Float32Array(posArray) 
        };
    }, [radius]);

    // --- PULSES (Energetic Thought Signals) ---
    const signals = useMemo(() => {
        // More pulses, clearer flow
        return Array.from({ length: 24 }, (_, i) => ({
            curveIndex: Math.floor(Math.random() * curves.length),
            progress: Math.random(),
            speed: (0.2 + Math.random() * 0.4) * speed,
            offset: Math.random() * Math.PI * 2,
            size: 0.02 + Math.random() * 0.03
        }));
    }, [curves, speed]);

    const signalPos = useMemo(() => new Float32Array(signals.length * 3), [signals]);
    const signalColors = useMemo(() => new Float32Array(signals.length * 3), [signals]);
    const signalSizes = useMemo(() => new Float32Array(signals.length), [signals]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        
        // 3D Absolute Positioning
        groupRef.current.position.y = modelY + heightOffset;
        groupRef.current.position.z = depthOffset;

        // Update Signals (The Firing Neurons)
        if (signalsRef.current) {
            const posAttr = signalsRef.current.geometry.attributes.position;
            const colorAttr = signalsRef.current.geometry.attributes.color;
            const sizeAttr = signalsRef.current.geometry.attributes.size;
            
            signals.forEach((sig, i) => {
                // Outward flow: 0 to 1
                sig.progress += sig.speed * 0.015;
                if (sig.progress > 1.0) {
                    sig.progress = 0;
                    sig.curveIndex = Math.floor(Math.random() * curves.length);
                }

                const point = curves[sig.curveIndex].getPointAt(sig.progress);
                
                posAttr.array[i * 3] = point.x;
                posAttr.array[i * 3 + 1] = point.y;
                posAttr.array[i * 3 + 2] = point.z;

                // --- VIBRANT PETROL SHIMMER ---
                const colT = t * 1.5 + sig.offset;
                const r = 0.5 + 0.5 * Math.cos(colT + 0);
                const g = 0.5 + 0.5 * Math.cos(colT + 2);
                const b = 0.5 + 0.5 * Math.cos(colT + 4);
                
                colorAttr.array[i * 3] = r;
                colorAttr.array[i * 3 + 1] = g;
                colorAttr.array[i * 3 + 2] = b;

                // Pulse breathing size
                sizeAttr.array[i] = sig.size * (1 + Math.sin(t * 10 + i) * 0.3) * intensity;
            });

            posAttr.needsUpdate = true;
            colorAttr.needsUpdate = true;
            sizeAttr.needsUpdate = true;
        }

        // Subtle slow rotation of the whole neural cloud
        groupRef.current.rotation.y = t * 0.04;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* Ghostly Synaptic Tracks (The branching skeleton) */}
            <lineSegments frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={treePositions.length / 3} array={treePositions} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial 
                    color={config.color || '#00f2ff'} 
                    transparent 
                    opacity={0.05 * intensity} 
                    blending={THREE.AdditiveBlending} 
                    depthWrite={false} 
                />
            </lineSegments>

            {/* NEURAL FIRING (Expanding thought signals) */}
            <points ref={signalsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={signals.length} array={signalPos} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={signals.length} array={signalColors} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={signals.length} array={signalSizes} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    uniforms={{
                        uTime: { value: 0 },
                        uIntensity: { value: intensity }
                    }}
                    vertexShader={`
                        attribute float size;
                        attribute vec3 color;
                        varying vec3 vColor;
                        void main() {
                            vColor = color;
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = size * (300.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        varying vec3 vColor;
                        void main() {
                            float d = distance(gl_PointCoord, vec2(0.5));
                            if (d > 0.5) discard;
                            float strength = pow(1.0 - d * 2.0, 2.0);
                            gl_FragColor = vec4(vColor, strength);
                        }
                    `}
                />
            </points>

            {/* Soft Central Nucleus Glow */}
            <mesh>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color={config.color || '#00f2ff'} transparent opacity={0.4 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            <pointLight intensity={0.8 * intensity} color={config.color || '#00f2ff'} distance={1.5} />
        </group>
    );
};

export default SynapseCore;
