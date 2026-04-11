import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- EASING ---
const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

const SynapseCore = ({ config, modelY }) => {
    const groupRef = useRef();
    const coreRef = useRef();
    const signalsRef = useRef();
    const junctionsRef = useRef();
    const explosionRef = useRef();

    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const radiusFactor = config.radius || 0.8;
    const nucleusScale = config.scale || 1.0;
    const pulseSizeFactor = config.pulseSize || 1.0;
    const nodeSizeFactor = config.nodeSize || 1.0;
    const lineWidthFactor = config.lineWidth || 1.0;
    const heightOffset = config.height || 0;
    const depthOffset = config.depth || 0;
    const offsetX = config.offsetX || 0;

    // --- NEURAL ARCHITECTURE v7 (Dendritic Movement) ---
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
                rootRadius * (1.2 + Math.random() * 0.4),
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2
            );

            // Control points for octopus-like wiggle
            const mid1 = center.clone().lerp(target, 0.3).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.6)
            );
            const mid2 = center.clone().lerp(target, 0.7).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.4)
            );

            const mainCurve = new THREE.CatmullRomCurve3([center, mid1, mid2, target]);
            allCurves.push(mainCurve);
            junctions.push(target);

            for (let s = 0; s < subBranchCount; s++) {
                const splitFactor = 0.2 + Math.random() * 0.5;
                const splitPoint = mainCurve.getPoint(splitFactor);
                junctions.push(splitPoint);
                
                const subTarget = new THREE.Vector3().setFromSphericalCoords(
                    rootRadius * 1.8,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI * 2
                );
                
                const subMid = splitPoint.clone().lerp(subTarget, 0.5).add(
                    new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.5)
                );
                
                const subCurve = new THREE.CatmullRomCurve3([splitPoint, subMid, subTarget]);
                allCurves.push(subCurve);
                junctions.push(subTarget);
            }
        }

        allCurves.forEach(curve => {
            const pts = curve.getPoints(segmentsPerCurve);
            for (let j = 0; j < pts.length - 1; j++) {
                posArray.push(pts[j].x, pts[j].y, pts[j].z, pts[j+1].x, pts[j+1].y, pts[j+1].z);
                const u1 = j / segmentsPerCurve;
                const u2 = (j+1) / segmentsPerCurve;
                // Opacity gradient for tapering effect
                opacArray.push(Math.pow(1.0 - u1, 1.5), Math.pow(1.0 - u2, 1.5));
            }
        });

        return { 
            curves: allCurves, 
            treePositions: new Float32Array(posArray),
            junctionPoints: new Float32Array(junctions.flatMap(p => [p.x, p.y, p.z])),
            branchOpacities: new Float32Array(opacArray)
        };
    }, []);

    // --- COMET SIGNALS ---
    const TRAIL_LENGTH = 7;
    const signals = useMemo(() => Array.from({ length: 32 }, (_, i) => ({
        curveIndex: Math.floor(Math.random() * curves.length),
        progress: -Math.random() * 2.0,
        speed: (0.2 + Math.random() * 0.3) * speed,
        offset: Math.random() * Math.PI * 2
    })), [curves, speed]);

    const signalData = useMemo(() => {
        const totalPoints = signals.length * TRAIL_LENGTH;
        return {
            pos: new Float32Array(totalPoints * 3),
            colors: new Float32Array(totalPoints * 3),
            sizes: new Float32Array(totalPoints)
        };
    }, [signals]);

    // --- EXPLOSION SYSTEM (Supernova Cluster) ---
    const particleCount = 128;
    const explosion = useMemo(() => {
        const particles = Array.from({ length: particleCount }, () => ({
            pos: new THREE.Vector3(0, 0, 0),
            vel: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(0.05 + Math.random() * 0.1),
            life: 0,
            maxLife: 1.5 + Math.random() * 1.5,
            colorOffset: Math.random() * Math.PI * 2,
            size: 0.01 + Math.random() * 0.02
        }));
        return {
            particles,
            posAttr: new Float32Array(particleCount * 3),
            colorAttr: new Float32Array(particleCount * 3),
            sizeAttr: new Float32Array(particleCount)
        };
    }, []);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        
        // 3D Positioning & Correction
        groupRef.current.position.set(offsetX, modelY + heightOffset, depthOffset);
        groupRef.current.scale.setScalar(radiusFactor);

        // Core Pulsation
        if (coreRef.current) {
            const b = 1.0 + Math.sin(t * 2.0) * 0.05;
            coreRef.current.scale.setScalar(nucleusScale * b);
            const cT = t * 0.4;
            coreRef.current.material.color.setRGB(
                0.5+0.5*Math.cos(cT), 0.5+0.5*Math.cos(cT+2), 0.5+0.5*Math.cos(cT+4)
            );
        }

        // Wiggle the tracks (Subtle Octopus motion)
        // Note: Real-time track regen is expensive, so we use a vertex displacement trick or just sway the group
        groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
        groupRef.current.rotation.x = Math.cos(t * 0.4) * 0.03;

        // Smart Comets
        if (signalsRef.current) {
            const pos = signalsRef.current.geometry.attributes.position;
            const col = signalsRef.current.geometry.attributes.color;
            const siz = signalsRef.current.geometry.attributes.size;

            signals.forEach((sig, i) => {
                sig.progress += sig.speed * 0.012;
                if (sig.progress > 1.0) {
                    sig.progress = -Math.random() * 1.5;
                    sig.curveIndex = Math.floor(Math.random() * curves.length);
                }
                const effP = sig.progress < 0 ? 0 : easeInOut(sig.progress);

                for (let j = 0; j < TRAIL_LENGTH; j++) {
                    const idx = i * TRAIL_LENGTH + j;
                    const trailT = Math.max(0, effP - j * 0.04);
                    const p = curves[sig.curveIndex].getPointAt(trailT);
                    pos.array[idx*3]=p.x; pos.array[idx*3+1]=p.y; pos.array[idx*3+2]=p.z;

                    const ct = t*2 + sig.offset + trailT;
                    col.array[idx*3]=0.5+0.5*Math.cos(ct); col.array[idx*3+1]=0.5+0.5*Math.cos(ct+2); col.array[idx*3+2]=0.5+0.5*Math.cos(ct+4);

                    const fade = Math.pow(1-(j/TRAIL_LENGTH), 2);
                    siz.array[idx] = (0.06 * pulseSizeFactor * fade * intensity) * (effP > 0 ? 1 : 0);
                }
            });
            pos.needsUpdate = true; col.needsUpdate = true; siz.needsUpdate = true;
        }

        // Explosion Particles (The Supernova)
        if (explosionRef.current) {
            const burstTrigger = Math.floor(t / 4) > Math.floor((t - 0.016) / 4);
            const pos = explosionRef.current.geometry.attributes.position;
            const col = explosionRef.current.geometry.attributes.color;
            const siz = explosionRef.current.geometry.attributes.size;

            explosion.particles.forEach((p, i) => {
                if (burstTrigger && Math.random() > 0.6) {
                    p.pos.set(0, 0, 0);
                    p.life = p.maxLife;
                }

                if (p.life > 0) {
                    p.life -= 0.016;
                    p.pos.add(p.vel);
                    
                    pos.array[i*3]=p.pos.x; pos.array[i*3+1]=p.pos.y; pos.array[i*3+2]=p.pos.z;
                    
                    const ct = t*3 + p.colorOffset;
                    const alpha = Math.max(0, p.life / p.maxLife);
                    col.array[i*3] = (0.5+0.5*Math.cos(ct)) * alpha;
                    col.array[i*3+1] = (0.5+0.5*Math.cos(ct+2)) * alpha;
                    col.array[i*3+2] = (0.5+0.5*Math.cos(ct+4)) * alpha;
                    siz.array[i] = p.size * alpha * intensity * 2.0;
                } else {
                    siz.array[i] = 0;
                }
            });
            pos.needsUpdate = true; col.needsUpdate = true; siz.needsUpdate = true;
        }

        // Junctions
        if (junctionsRef.current) {
            const cat = junctionsRef.current.geometry.attributes.color;
            for (let i = 0; i < cat.count; i++) {
                const ct = t*0.5 + i*0.1;
                cat.array[i*3]=0.5+0.5*Math.cos(ct); cat.array[i*3+1]=0.5+0.5*Math.cos(ct+2); cat.array[i*3+2]=0.5+0.5*Math.cos(ct+4);
            }
            cat.needsUpdate = true;
            junctionsRef.current.material.size = 0.015 * nodeSizeFactor * (1 + Math.sin(t*3)*0.2);
        }

        groupRef.current.rotation.y = t * 0.02;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* Tapered Skeleton */}
            <lineSegments frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={treePositions.length/3} array={treePositions} itemSize={3} />
                    <bufferAttribute attach="attributes-opacity" count={branchOpacities.length} array={branchOpacities} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent depthWrite={false} blending={THREE.AdditiveBlending}
                    uniforms={{ uIntensity: { value: intensity }, uWidth: { value: lineWidthFactor } }}
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
                        uniform float uWidth;
                        varying float vOpacity;
                        void main() {
                            gl_FragColor = vec4(vec3(1.0), vOpacity * 0.05 * uIntensity * uWidth);
                        }
                    `}
                />
            </lineSegments>

            {/* Pearlescent Junctions */}
            <points ref={junctionsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={junctionPoints.length/3} array={junctionPoints} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={junctionPoints.length/3} array={junctionPoints} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial vertexColors transparent opacity={0.6*intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>

            {/* Smart Comets */}
            <points ref={signalsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={signals.length * TRAIL_LENGTH} array={signalData.pos} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={signals.length * TRAIL_LENGTH} array={signalData.colors} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={signals.length * TRAIL_LENGTH} array={signalData.sizes} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent depthWrite={false} blending={THREE.AdditiveBlending}
                    vertexShader={`
                        attribute float size; attribute vec3 color; varying vec3 vColor;
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
                            gl_FragColor = vec4(vColor, pow(1.0 - d * 2.0, 3.0));
                        }
                    `}
                />
            </points>

            {/* SUPERNOVA EXPLOSION */}
            <points ref={explosionRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={particleCount} array={explosion.posAttr} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={particleCount} array={explosion.colorAttr} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={particleCount} array={explosion.sizeAttr} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent depthWrite={false} blending={THREE.AdditiveBlending}
                    vertexShader={`
                        attribute float size; attribute vec3 color; varying vec3 vColor;
                        void main() {
                            vColor = color;
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = size * (600.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        varying vec3 vColor;
                        void main() {
                            float d = distance(gl_PointCoord, vec2(0.5));
                            if (d > 0.5) discard;
                            gl_FragColor = vec4(vColor, pow(1.0 - d * 2.0, 2.0));
                        }
                    `}
                />
            </points>

            <mesh ref={coreRef}>
                <sphereGeometry args={[0.045, 32, 32]} />
                <meshBasicMaterial transparent opacity={0.6*intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            <pointLight intensity={0.7 * intensity} color={config.color || '#00f2ff'} distance={2.5} />
        </group>
    );
};

export default SynapseCore;
