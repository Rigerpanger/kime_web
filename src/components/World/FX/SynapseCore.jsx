import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- EASING FUNCTION (Ease In-Out Quad) ---
const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

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
    const nodeSizeFactor = config.nodeSize || 1.0;
    const heightOffset = config.height || 0;
    const depthOffset = config.depth || 0;

    // --- NEURAL ARCHITECTURE v6 (Organic Sinuosity) ---
    const { curves, treePositions, junctionPoints, branchOpacities } = useMemo(() => {
        const branchCount = 12;
        const subBranchCount = 4;
        const segmentsPerCurve = 40;
        const allCurves = [];
        const posArray = [];
        const opacArray = [];
        const junctions = [];

        const rootRadius = 0.5;

        for (let i = 0; i < branchCount; i++) {
            const center = new THREE.Vector3(0, 0, 0);
            const target = new THREE.Vector3().setFromSphericalCoords(
                rootRadius * (1.1 + Math.random() * 0.4),
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2
            );

            // Multiple mid-points for organic sinuosity (No straight lines)
            const mid1 = center.clone().lerp(target, 0.3).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.5)
            );
            const mid2 = center.clone().lerp(target, 0.7).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.3)
            );

            const mainCurve = new THREE.CatmullRomCurve3([center, mid1, mid2, target]);
            allCurves.push(mainCurve);
            junctions.push(target); // End node

            for (let s = 0; s < subBranchCount; s++) {
                const splitFactor = 0.2 + Math.random() * 0.5;
                const splitPoint = mainCurve.getPoint(splitFactor);
                junctions.push(splitPoint);
                
                const subTarget = new THREE.Vector3().setFromSphericalCoords(
                    rootRadius * 1.6,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI * 2
                );
                
                // Sub-branch mid-point
                const subMid = splitPoint.clone().lerp(subTarget, 0.5).add(
                    new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.4)
                );
                
                const subCurve = new THREE.CatmullRomCurve3([splitPoint, subMid, subTarget]);
                allCurves.push(subCurve);
                junctions.push(subTarget); // Tip node
            }
        }

        allCurves.forEach(curve => {
            const pts = curve.getPoints(segmentsPerCurve);
            for (let j = 0; j < pts.length - 1; j++) {
                posArray.push(pts[j].x, pts[j].y, pts[j].z, pts[j+1].x, pts[j+1].y, pts[j+1].z);
                const u1 = j / segmentsPerCurve;
                const u2 = (j+1) / segmentsPerCurve;
                opacArray.push(Math.pow(1.0 - u1, 1.2), Math.pow(1.0 - u2, 1.2));
            }
        });

        const juncPts = new Float32Array(junctions.length * 3);
        const juncColors = new Float32Array(junctions.length * 3);
        junctions.forEach((p, i) => {
            juncPts[i*3] = p.x; juncPts[i*3+1] = p.y; juncPts[i*3+2] = p.z;
        });

        return { 
            curves: allCurves, 
            treePositions: new Float32Array(posArray),
            junctionPoints: juncPts,
            junctionColors: juncColors,
            branchOpacities: new Float32Array(opacArray)
        };
    }, []);

    // --- COMET STREAK SYSTEM (Tapering tail) ---
    const TRAIL_LENGTH = 6;
    const signals = useMemo(() => {
        return Array.from({ length: 28 }, (_, i) => ({
            curveIndex: Math.floor(Math.random() * curves.length),
            progress: -Math.random() * 2.0, // Staggered start
            speed: (0.2 + Math.random() * 0.3) * speed,
            offset: Math.random() * Math.PI * 2
        }));
    }, [curves, speed]);

    // Positions, Colors, and Sizes for each particle in the streak
    const totalPoints = signals.length * TRAIL_LENGTH;
    const signalPos = useMemo(() => new Float32Array(totalPoints * 3), [totalPoints]);
    const signalColors = useMemo(() => new Float32Array(totalPoints * 3), [totalPoints]);
    const signalSizes = useMemo(() => new Float32Array(totalPoints), [totalPoints]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        
        // 3D Centering & Global scaling
        groupRef.current.position.y = modelY + heightOffset;
        groupRef.current.position.z = depthOffset;
        groupRef.current.scale.setScalar(radiusFactor);

        // --- GLOSSY PETROL CORE (Nucleus) ---
        if (coreRef.current) {
            const breathe = 1.0 + Math.sin(t * 1.5) * 0.04;
            coreRef.current.scale.setScalar(nucleusScale * breathe);
            
            // Core Iridescence
            const cT = t * 0.4;
            coreRef.current.material.color.setRGB(
                0.5 + 0.5 * Math.cos(cT + 0),
                0.5 + 0.5 * Math.cos(cT + 2),
                0.5 + 0.5 * Math.cos(cT + 4)
            );
        }

        // --- IRIDESCENT NODES ---
        if (junctionsRef.current) {
            const colorAttr = junctionsRef.current.geometry.attributes.color;
            const size = 0.015 * nodeSizeFactor * (1 + Math.sin(t * 2.0) * 0.2);
            junctionsRef.current.material.size = size;

            for (let i = 0; i < colorAttr.count; i++) {
                const cT = t * 0.3 + i * 0.1;
                colorAttr.array[i*3] = 0.5 + 0.5 * Math.cos(cT + 0);
                colorAttr.array[i*3+1] = 0.5 + 0.5 * Math.cos(cT + 2);
                colorAttr.array[i*3+2] = 0.5 + 0.5 * Math.cos(cT + 4);
            }
            colorAttr.needsUpdate = true;
        }

        // --- SMART COMETS (Easing + Tapering) ---
        if (signalsRef.current) {
            const posAttr = signalsRef.current.geometry.attributes.position;
            const colorAttr = signalsRef.current.geometry.attributes.color;
            const sizeAttr = signalsRef.current.geometry.attributes.size;

            signals.forEach((sig, i) => {
                sig.progress += sig.speed * 0.012;
                
                if (sig.progress > 1.0) {
                    sig.progress = -Math.random() * 1.5; 
                    sig.curveIndex = Math.floor(Math.random() * curves.length);
                }

                // Apply Ease-In-Out to calculated progress
                const effectiveProgress = sig.progress < 0 ? 0 : easeInOut(sig.progress);

                // Update each point in the trail
                for (let j = 0; j < TRAIL_LENGTH; j++) {
                    const idx = i * TRAIL_LENGTH + j;
                    const trailT = Math.max(0, effectiveProgress - j * 0.035);
                    const point = curves[sig.curveIndex].getPointAt(trailT);

                    posAttr.array[idx * 3] = point.x;
                    posAttr.array[idx * 3 + 1] = point.y;
                    posAttr.array[idx * 3 + 2] = point.z;

                    // Gasoline Shimmer
                    const colT = t * 2.0 + sig.offset + trailT;
                    colorAttr.array[idx * 3] = 0.5 + 0.5 * Math.cos(colT + 0);
                    colorAttr.array[idx * 3 + 1] = 0.5 + 0.5 * Math.cos(colT + 2);
                    colorAttr.array[idx * 3 + 2] = 0.5 + 0.5 * Math.cos(colT + 4);

                    // Tapering size (head is biggest)
                    const fade = Math.pow(1.0 - (j / TRAIL_LENGTH), 2.0);
                    sizeAttr.array[idx] = (0.05 * pulseSizeFactor * fade * intensity) * (effectiveProgress > 0 ? 1 : 0);
                }
            });

            posAttr.needsUpdate = true;
            colorAttr.needsUpdate = true;
            sizeAttr.needsUpdate = true;
        }

        groupRef.current.rotation.y = t * 0.03;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* ANATOMICAL SKELETON (Ghostly Threads) */}
            <lineSegments frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={treePositions.length / 3} array={treePositions} itemSize={3} />
                    <bufferAttribute attach="attributes-opacity" count={branchOpacities.length} array={branchOpacities} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    uniforms={{ uIntensity: { value: intensity } }}
                    vertexShader={`
                        attribute float opacity;
                        varying float vOpacity;
                        void main() {
                            vOpacity = opacity;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        uniform float uIntensity;
                        varying float vOpacity;
                        void main() {
                            // Faint white tracks for subtle structure
                            gl_FragColor = vec4(vec3(1.0), vOpacity * 0.04 * uIntensity);
                        }
                    `}
                />
            </lineSegments>

            {/* GLOSSY NODES (Iridescent Junctions) */}
            <points ref={junctionsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={junctionPoints.length / 3} array={junctionPoints} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={junctionPoints.length / 3} array={junctionPoints} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.015} vertexColors transparent opacity={0.6 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>

            {/* IRIDESCENT COMETS (Tapered Streaks) */}
            <points ref={signalsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={totalPoints} array={signalPos} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={totalPoints} array={signalColors} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={totalPoints} array={signalSizes} itemSize={1} />
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
                            gl_PointSize = size * (350.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        varying vec3 vColor;
                        void main() {
                            float d = distance(gl_PointCoord, vec2(0.5));
                            if (d > 0.5) discard;
                            float strength = pow(1.0 - d * 2.0, 3.0);
                            gl_FragColor = vec4(vColor, strength);
                        }
                    `}
                />
            </points>

            {/* NUCLEUS (Iridescent Core) */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.045, 32, 32]} />
                <meshBasicMaterial transparent opacity={0.6 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            <pointLight intensity={0.6 * intensity} color={config.color || '#00f2ff'} distance={2.5} />
        </group>
    );
};

export default SynapseCore;
