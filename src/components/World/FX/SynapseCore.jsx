import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SynapseCore = ({ config, modelY }) => {
    const groupRef = useRef();
    const coreRef = useRef();
    const signalsRef = useRef();
    const junctionsRef = useRef();

    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const radiusFactor = config.radius || 0.8; 
    const nucleusScale = config.scale || 1.0;
    const pulseSizeFactor = config.pulseSize || 1.0;
    const heightOffset = config.height || 0;
    const depthOffset = config.depth || 0;

    // --- NEURAL ARCHITECTURE v5 (Branching & Junctions) ---
    const { curves, treePositions, junctionPoints, branchOpacities } = useMemo(() => {
        const branchCount = 10;
        const subBranchCount = 4;
        const segmentsPerCurve = 32;
        const allCurves = [];
        const posArray = [];
        const opacArray = [];
        const junctions = [];

        const rootRadius = 0.5; // Fixed base size, we scale the whole group later

        for (let i = 0; i < branchCount; i++) {
            const center = new THREE.Vector3(0, 0, 0);
            const target = new THREE.Vector3().setFromSphericalCoords(
                rootRadius * (1.0 + Math.random() * 0.5),
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2
            );

            const mid = center.clone().lerp(target, 0.5).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.4)
            );
            const mainCurve = new THREE.CatmullRomCurve3([center, mid, target]);
            allCurves.push(mainCurve);

            // Junction at 50%
            junctions.push(mainCurve.getPoint(0.5));

            for (let s = 0; s < subBranchCount; s++) {
                const splitFactor = 0.4 + Math.random() * 0.4;
                const splitPoint = mainCurve.getPoint(splitFactor);
                junctions.push(splitPoint);
                
                const subTarget = new THREE.Vector3().setFromSphericalCoords(
                    rootRadius * 1.5,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI * 2
                );
                const subMid = splitPoint.clone().lerp(subTarget, 0.5).add(
                    new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.3)
                );
                
                const subCurve = new THREE.CatmullRomCurve3([splitPoint, subMid, subTarget]);
                allCurves.push(subCurve);
            }
        }

        allCurves.forEach(curve => {
            const pts = curve.getPoints(segmentsPerCurve);
            for (let j = 0; j < pts.length - 1; j++) {
                posArray.push(pts[j].x, pts[j].y, pts[j].z, pts[j+1].x, pts[j+1].y, pts[j+1].z);
                const u1 = j / segmentsPerCurve;
                const u2 = (j+1) / segmentsPerCurve;
                // Fade out towards tips
                opacArray.push(Math.pow(1.0 - u1, 1.5), Math.pow(1.0 - u2, 1.5));
            }
        });

        const juncPts = new Float32Array(junctions.length * 3);
        junctions.forEach((p, i) => {
            juncPts[i*3] = p.x;
            juncPts[i*3+1] = p.y;
            juncPts[i*3+2] = p.z;
        });

        return { 
            curves: allCurves, 
            treePositions: new Float32Array(posArray),
            junctionPoints: juncPts,
            branchOpacities: new Float32Array(opacArray)
        };
    }, []); // Regenerate only on heavy changes, radius handled by group scale

    // --- PULSE SIGNAL SYSTEM (The Burst) ---
    const signals = useMemo(() => {
        return Array.from({ length: 32 }, (_, i) => ({
            curveIndex: Math.floor(Math.random() * curves.length),
            progress: -Math.random() * 2, // staggered start
            speed: (0.3 + Math.random() * 0.4) * speed,
            offset: Math.random() * Math.PI * 2,
            size: 0.02 + Math.random() * 0.04
        }));
    }, [curves, speed]);

    const signalPos = useMemo(() => new Float32Array(signals.length * 3), [signals]);
    const signalColors = useMemo(() => new Float32Array(signals.length * 3), [signals]);
    const signalSizes = useMemo(() => new Float32Array(signals.length), [signals]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        
        // 3D Absolute Positioning with Responsive Scale (Radius factor)
        groupRef.current.position.y = modelY + heightOffset;
        groupRef.current.position.z = depthOffset;
        groupRef.current.scale.setScalar(radiusFactor); // Radius slider scales the WHOLE effect

        // Nucleus Sun (Solars / Breathing)
        if (coreRef.current) {
            const breathing = 1.0 + Math.sin(t * 2.0) * 0.05;
            coreRef.current.scale.setScalar(nucleusScale * breathing);
            coreRef.current.rotation.y = t * 0.15;
        }

        // Rhythmic Signal Burst Logic
        if (signalsRef.current) {
            const posAttr = signalsRef.current.geometry.attributes.position;
            const colorAttr = signalsRef.current.geometry.attributes.color;
            const sizeAttr = signalsRef.current.geometry.attributes.size;
            
            signals.forEach((sig, i) => {
                // Outward burst flow
                sig.progress += sig.speed * 0.012;
                
                // If signal hasn't "started" yet (negative progress), hide it
                if (sig.progress < 0) {
                    posAttr.array[i*3] = 0; posAttr.array[i*3+1] = 0; posAttr.array[i*3+2] = 0;
                    sizeAttr.array[i] = 0;
                } else if (sig.progress > 1.0) {
                    // Reset to center but wait for next "burst"
                    sig.progress = -Math.random() * 1.5; 
                    sig.curveIndex = Math.floor(Math.random() * curves.length);
                } else {
                    const point = curves[sig.curveIndex].getPointAt(sig.progress);
                    posAttr.array[i * 3] = point.x;
                    posAttr.array[i * 3 + 1] = point.y;
                    posAttr.array[i * 3 + 2] = point.z;

                    // --- BOLD GASOLINE SHIMMER ---
                    const colT = t * 2.0 + sig.offset;
                    colorAttr.array[i * 3] = 0.5 + 0.5 * Math.cos(colT + 0);
                    colorAttr.array[i * 3 + 1] = 0.5 + 0.5 * Math.cos(colT + 2);
                    colorAttr.array[i * 3 + 2] = 0.5 + 0.5 * Math.cos(colT + 4);

                    // Signal sizing with pulse factor
                    sizeAttr.array[i] = sig.size * pulseSizeFactor * intensity;
                }
            });

            posAttr.needsUpdate = true;
            colorAttr.needsUpdate = true;
            sizeAttr.needsUpdate = true;
        }

        // Junction Node breathing
        if (junctionsRef.current) {
            junctionsRef.current.material.opacity = (0.2 + Math.sin(t * 3.0) * 0.1) * intensity;
        }

        groupRef.current.rotation.y = t * 0.02;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* The Axonal Skeleton (Faded Branching Threads) */}
            <lineSegments frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={treePositions.length / 3} array={treePositions} itemSize={3} />
                    <bufferAttribute attach="attributes-opacity" count={branchOpacities.length} array={branchOpacities} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    uniforms={{ uColor: { value: new THREE.Color(config.color || '#00f2ff') }, uIntensity: { value: intensity } }}
                    vertexShader={`
                        attribute float opacity;
                        varying float vOpacity;
                        void main() {
                            vOpacity = opacity;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        uniform vec3 uColor;
                        uniform float uIntensity;
                        varying float vOpacity;
                        void main() {
                            gl_FragColor = vec4(uColor, vOpacity * 0.1 * uIntensity);
                        }
                    `}
                />
            </lineSegments>

            {/* JUNCTION NODES (The Synapses) */}
            <points ref={junctionsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={junctionPoints.length / 3} array={junctionPoints} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.008} color={config.color || '#00f2ff'} transparent opacity={0.2 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>

            {/* NEURAL FIRING (Expanding Bursts) */}
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
                    vertexShader={`
                        attribute float size;
                        attribute vec3 color;
                        varying vec3 vColor;
                        void main() {
                            vColor = color;
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = size * (400.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        varying vec3 vColor;
                        void main() {
                            float d = distance(gl_PointCoord, vec2(0.5));
                            if (d > 0.5) discard;
                            // Soft orb falloff
                            float strength = pow(1.0 - d * 2.0, 3.0);
                            gl_FragColor = vec4(vColor, strength);
                        }
                    `}
                />
            </points>

            {/* THE NUCLEUS (Central Sun/Core) */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.04, 32, 32]} />
                <meshBasicMaterial color={config.color || '#00f2ff'} transparent opacity={0.5 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
                <mesh scale={1.5}>
                    <sphereGeometry args={[0.04, 16, 16]} />
                    <meshBasicMaterial color={config.color || '#00f2ff'} wireframe transparent opacity={0.2 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            </mesh>

            <pointLight intensity={0.5 * intensity} color={config.color || '#00f2ff'} distance={2.0} />
        </group>
    );
};

export default SynapseCore;
