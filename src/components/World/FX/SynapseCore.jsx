import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- EASING ---
const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

const SynapseCore = ({ config, modelY }) => {
    const groupRef = useRef();
    const coreRef = useRef();
    const cageRef = useRef();
    const crystalRef = useRef();
    const auraRef = useRef();
    const signalsRef = useRef();
    const cordsRef = useRef();
    const dustRef = useRef();
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

    // --- NEURAL TREE v9.1 (Architecture & Distance Data) ---
    const { curves, cordPositions, cordSizes, cordDists } = useMemo(() => {
        const branchCount = 14;
        const subBranchCount = 3;
        const pointsPerCord = 200;
        const allCurves = [];
        const posArray = [];
        const sizeArray = [];
        const distArray = [];

        const rootRadius = 0.5;

        for (let i = 0; i < branchCount; i++) {
            const target = new THREE.Vector3().setFromSphericalCoords(
                rootRadius * (1.1 + Math.random() * 0.4),
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2
            );
            const mid1 = new THREE.Vector3().lerpVectors(new THREE.Vector3(0,0,0), target, 0.3).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.5)
            );
            const mid2 = new THREE.Vector3().lerpVectors(new THREE.Vector3(0,0,0), target, 0.7).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius * 0.3)
            );
            const mainCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0), mid1, mid2, target]);
            allCurves.push(mainCurve);

            for (let s = 0; s < subBranchCount; s++) {
                const sf = 0.3 + Math.random() * 0.5;
                const sp = mainCurve.getPoint(sf);
                const st = new THREE.Vector3().setFromSphericalCoords(rootRadius * 1.6, Math.random()*Math.PI, Math.random()*Math.PI*2);
                const sm = new THREE.Vector3().lerpVectors(sp, st, 0.5).add(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius*0.4));
                allCurves.push(new THREE.CatmullRomCurve3([sp, sm, st]));
            }
        }

        allCurves.forEach((curve) => {
            const l = curve.getLength();
            for (let j = 0; j < pointsPerCord; j++) {
                const t = j / pointsPerCord;
                const p = curve.getPoint(t);
                const noise = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(0.008);
                posArray.push(p.x + noise.x, p.y + noise.y, p.z + noise.z);
                sizeArray.push(Math.pow(1.0 - t, 1.2));
                distArray.push(p.length()); // Used for sequential pulse
            }
        });

        return { 
            curves: allCurves, 
            cordPositions: new Float32Array(posArray),
            cordSizes: new Float32Array(sizeArray),
            cordDists: new Float32Array(distArray)
        };
    }, []);

    // --- MANHATTAN BITS (AI Logic Grains) ---
    const dustCount = 200;
    const dustData = useMemo(() => {
        const particles = Array.from({ length: dustCount }, () => ({
            pos: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(2.0),
            axis: ['x', 'y', 'z'][Math.floor(Math.random() * 3)],
            dir: Math.random() > 0.5 ? 1 : -1,
            speed: 0.002 + Math.random() * 0.004,
            changeIn: Math.random() * 100
        }));
        return { 
            particles,
            posAttr: new Float32Array(dustCount * 3)
        };
    }, []);

    // --- COMETS & EXPLOSIONS (Presets) ---
    const TRAIL_LENGTH = 8;
    const signals = useMemo(() => Array.from({ length: 24 }, () => ({
        curveIndex: Math.floor(Math.random() * curves.length),
        progress: -Math.random() * 2.5,
        speed: (0.3 + Math.random() * 0.4) * speed,
        offset: Math.random() * Math.PI * 2
    })), [curves, speed]);

    const signalData = useMemo(() => {
        const total = signals.length * TRAIL_LENGTH;
        return {
            pos: new Float32Array(total * 3),
            colors: new Float32Array(total * 3),
            sizes: new Float32Array(total)
        };
    }, [signals]);

    const particleCount = 100;
    const explosion = useMemo(() => {
        const particles = Array.from({ length: particleCount }, () => ({
            pos: new THREE.Vector3(0, 0, 0),
            vel: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(0.05 + Math.random() * 0.12),
            life: 0,
            maxLife: 1.0 + Math.random() * 1.5,
            colorOffset: Math.random() * Math.PI * 2,
            size: 0.012 + Math.random() * 0.02
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
        
        // 3D Absolute Center
        groupRef.current.position.set(offsetX, modelY + heightOffset, depthOffset);
        groupRef.current.scale.setScalar(radiusFactor);

        // --- MANIFESTATION PULSE (V9.1) ---
        // Cycle: 0->1 (fill out), Stay, 1->2 (fade out)
        const pulseCycle = (t * 0.25 * speed) % 4.0; 
        const manifestProgress = Math.min(1.5, pulseCycle > 2.0 ? 0 : pulseCycle); // Simplified linear wave
        if (cordsRef.current) {
            cordsRef.current.material.uniforms.uPulse.value = pulseCycle;
            cordsRef.current.rotation.y = Math.sin(t * 0.4) * 0.04;
        }

        // --- DIMMED NUCLEUS & CRYSTAL ---
        if (coreRef.current) {
            coreRef.current.scale.setScalar(nucleusScale * (1.0 + Math.sin(t*3)*0.05));
            const ct = t * 0.4;
            coreRef.current.material.color.setRGB(
                (0.5+0.5*Math.cos(ct))*0.7, (0.5+0.5*Math.cos(ct+2))*0.7, (0.5+0.5*Math.cos(ct+4))*0.7
            );
        }
        if (cageRef.current) cageRef.current.rotation.y = -t * 0.2;
        if (crystalRef.current) {
            crystalRef.current.rotation.x = t * 0.5;
            crystalRef.current.rotation.y = t * 0.8;
            crystalRef.current.scale.setScalar(nucleusScale * 1.8);
        }
        if (auraRef.current) {
            auraRef.current.scale.setScalar(nucleusScale * (5.0 + Math.sin(t*2)*0.4));
            auraRef.current.material.opacity = 0.2 * intensity; // -30% vs v8
        }

        // --- MANHATTAN BITS MOTION ---
        if (dustRef.current) {
            const pos = dustRef.current.geometry.attributes.position;
            dustData.particles.forEach((p, i) => {
                p.changeIn -= 1;
                if (p.changeIn <= 0) {
                    p.axis = ['x', 'y', 'z'][Math.floor(Math.random() * 3)];
                    p.dir = Math.random() > 0.5 ? 1 : -1;
                    p.changeIn = 50 + Math.random() * 150;
                }
                const v = p.speed;
                if (p.axis === 'x') p.pos.x += v * p.dir;
                else if (p.axis === 'y') p.pos.y += v * p.dir;
                else p.pos.z += v * p.dir;

                if (p.pos.length() > 1.2) p.pos.multiplyScalar(0.95);
                
                pos.array[i*3]=p.pos.x; pos.array[i*3+1]=p.pos.y; pos.array[i*3+2]=p.pos.z;
            });
            pos.needsUpdate = true;
        }

        // --- COMETS ---
        if (signalsRef.current) {
            const pos = signalsRef.current.geometry.attributes.position;
            const col = signalsRef.current.geometry.attributes.color;
            const siz = signalsRef.current.geometry.attributes.size;
            signals.forEach((sig, i) => {
                sig.progress += sig.speed * 0.012;
                if (sig.progress > 1.0) {
                    sig.progress = -Math.random() * 2.0;
                    sig.curveIndex = Math.floor(Math.random() * curves.length);
                }
                const ep = sig.progress < 0 ? 0 : easeInOut(sig.progress);
                for (let j = 0; j < TRAIL_LENGTH; j++) {
                    const idx = i * TRAIL_LENGTH + j;
                    const tt = Math.max(0, ep - j * 0.04);
                    const p = curves[sig.curveIndex].getPointAt(tt);
                    pos.array[idx*3]=p.x; pos.array[idx*3+1]=p.y; pos.array[idx*3+2]=p.z;
                    const ct = t*2 + sig.offset + tt;
                    col.array[idx*3]=0.5+0.5*Math.cos(ct); col.array[idx*3+1]=0.5+0.5*Math.cos(ct+2); col.array[idx*3+2]=0.5+0.5*Math.cos(ct+4);
                    const fade = Math.pow(1-(j/TRAIL_LENGTH), 2.5);
                    siz.array[idx] = (0.07 * pulseSizeFactor * fade * intensity) * (ep > 0 ? 1 : 0);
                }
            });
            pos.needsUpdate = true; col.needsUpdate = true; siz.needsUpdate = true;
        }

        // --- EXPLOSIONS ---
        if (explosionRef.current) {
            const tr = Math.floor(t / 6) > Math.floor((t - 0.016) / 6);
            const pos = explosionRef.current.geometry.attributes.position;
            const col = explosionRef.current.geometry.attributes.color;
            const siz = explosionRef.current.geometry.attributes.size;
            explosion.particles.forEach((p, i) => {
                if (tr && Math.random() > 0.7) { p.pos.set(0,0,0); p.life = p.maxLife; }
                if (p.life > 0) {
                    p.life -= 0.016; p.pos.add(p.vel);
                    pos.array[i*3]=p.pos.x; pos.array[i*3+1]=p.pos.y; pos.array[i*3+2]=p.pos.z;
                    const ct = t*3.5 + p.colorOffset; const a = Math.max(0, p.life / p.maxLife);
                    col.array[i*3]=(0.5+0.5*Math.cos(ct))*a; col.array[i*3+1]=(0.5+0.5*Math.cos(ct+2))*a; col.array[i*3+2]=(0.5+0.5*Math.cos(ct+4))*a;
                    siz.array[i] = p.size * a * intensity * 2.5;
                } else { siz.array[i] = 0; }
            });
            pos.needsUpdate = true; col.needsUpdate = true; siz.needsUpdate = true;
        }
        groupRef.current.rotation.y = t * 0.02;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* GHOSTLY RESPONSIVE CORDS */}
            <points ref={cordsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={cordPositions.length/3} array={cordPositions} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={cordSizes.length} array={cordSizes} itemSize={1} />
                    <bufferAttribute attach="attributes-dist" count={cordDists.length} array={cordDists} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent depthWrite={false} blending={THREE.AdditiveBlending}
                    uniforms={{ uIntensity: { value: intensity }, uWidth: { value: lineWidthFactor }, uPulse: { value: 0 } }}
                    vertexShader={`
                        attribute float size;
                        attribute float dist;
                        varying float vFade;
                        varying float vDist;
                        void main() {
                            vFade = size;
                            vDist = dist;
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = size * uWidth * (280.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        uniform float uIntensity;
                        uniform float uPulse;
                        varying float vFade;
                        varying float vDist;
                        void main() {
                            float d = distance(gl_PointCoord, vec2(0.5));
                            if (d > 0.5) discard;
                            
                            // Sequential Manifesto Wave (0-1: Fill, 1-2: Hold/Fade, 2-3: Empty)
                            float cycle = mod(uPulse, 4.0);
                            float manifest = smoothstep(cycle - 0.2, cycle, vDist * 0.8);
                            float fade = smoothstep(cycle - 1.5, cycle - 1.3, vDist * 0.8);
                            float alpha = (1.0 - manifest) * (1.0 - fade);

                            gl_FragColor = vec4(vec3(1.0), alpha * vFade * pow(1.0-d*2.0, 2.0) * 0.15 * uIntensity);
                        }
                    `}
                />
            </points>

            {/* AI BITS (Manhattan grains) */}
            <points ref={dustRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={dustCount} array={dustData.posAttr} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.006} color="#ffffff" transparent opacity={0.2 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>

            {/* COMETS, EXPLOSIONS, CORE */}
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
                            gl_PointSize = size * (450.0 / -mvPosition.z);
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

            {/* LOWERED INTENSITY NUCLEUS */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.045, 32, 32]} />
                <meshBasicMaterial transparent opacity={0.5*intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={cageRef}>
                <icosahedronGeometry args={[0.051, 1]} />
                <meshBasicMaterial wireframe transparent opacity={0.2*intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={crystalRef}>
                <octahedronGeometry args={[0.03]} />
                <meshBasicMaterial wireframe transparent opacity={0.4*intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={auraRef}>
                <planeGeometry args={[0.2, 0.2]} />
                <meshBasicMaterial 
                    transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false}
                    map={new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/glow.png')}
                />
            </mesh>

            <pointLight intensity={0.6 * intensity} color={config.color || '#00f2ff'} distance={2.5} />
        </group>
    );
};

export default SynapseCore;
