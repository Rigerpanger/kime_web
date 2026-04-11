import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

const SynapseCore = ({ config, modelY }) => {
    const groupRef = useRef();
    const coreRef = useRef();
    const cageRef = useRef();
    const auraRef = useRef();
    const signalsRef = useRef();
    const cordsRef = useRef();
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

    // --- NEURAL TREE v10 (Permanent Structure) ---
    const { curves, cordPositions, cordSizes, junctionPoints } = useMemo(() => {
        const branchCount = 14;
        const subBranchCount = 3;
        const pointsPerCord = 150;
        const allCurves = [];
        const posArray = [];
        const sizeArray = [];
        const junctions = [];

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
            const mainCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0), mid1, target]);
            allCurves.push(mainCurve);
            junctions.push(target);

            for (let s = 0; s < subBranchCount; s++) {
                const sf = 0.4 + Math.random() * 0.5;
                const sp = mainCurve.getPoint(sf);
                junctions.push(sp);
                const st = new THREE.Vector3().setFromSphericalCoords(rootRadius * 1.8, Math.random()*Math.PI, Math.random()*Math.PI*2);
                const sm = new THREE.Vector3().lerpVectors(sp, st, 0.5).add(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(rootRadius*0.4));
                allCurves.push(new THREE.CatmullRomCurve3([sp, sm, st]));
                junctions.push(st);
            }
        }

        allCurves.forEach((curve) => {
            for (let j = 0; j < pointsPerCord; j++) {
                const t = j / pointsPerCord;
                const p = curve.getPoint(t);
                const noise = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(0.015);
                posArray.push(p.x + noise.x, p.y + noise.y, p.z + noise.z);
                sizeArray.push(Math.pow(1.0 - t, 0.8));
            }
        });

        return { 
            curves: allCurves, 
            cordPositions: new Float32Array(posArray),
            cordSizes: new Float32Array(sizeArray),
            junctionPoints: new Float32Array(junctions.flatMap(v => [v.x, v.y, v.z]))
        };
    }, []);

    const TRAIL_LENGTH = 8;
    const signals = useMemo(() => Array.from({ length: 30 }, () => ({
        curveIndex: Math.floor(Math.random() * curves.length),
        progress: -Math.random() * 2.0,
        speed: (0.3 + Math.random() * 0.5) * speed,
        offset: Math.random() * Math.PI * 2
    })), [curves, speed]);

    const signalData = useMemo(() => {
        const total = signals.length * TRAIL_LENGTH;
        return { pos: new Float32Array(total * 3), colors: new Float32Array(total * 3), sizes: new Float32Array(total) };
    }, [signals]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;
        
        groupRef.current.position.set(offsetX, modelY + heightOffset, depthOffset);
        groupRef.current.scale.setScalar(radiusFactor);

        // --- NUCLEUS (Cyan Plasma) ---
        if (coreRef.current) {
            coreRef.current.scale.setScalar(nucleusScale * (1.0 + Math.sin(t*4)*0.05));
            coreRef.current.material.color.setHSL(0.5 + Math.sin(t)*0.05, 1, 0.6);
        }
        if (cageRef.current) {
            cageRef.current.rotation.y = t * 0.5;
            cageRef.current.rotation.x = t * 0.3;
        }
        if (auraRef.current) {
            auraRef.current.scale.setScalar(nucleusScale * (5.0 + Math.sin(t*2)*0.4));
            auraRef.current.material.opacity = 0.25 * intensity;
        }

        // --- PERMANENT CORDS ---
        if (cordsRef.current) {
            cordsRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
            cordsRef.current.material.uniforms.uTime.value = t;
        }

        // --- JUNCTIONS (Nodes) ---
        if (junctionsRef.current) {
            junctionsRef.current.material.size = 0.012 * nodeSizeFactor * (1.0 + Math.sin(t*3)*0.15);
        }

        // --- SIGNALS ---
        if (signalsRef.current) {
            const pos = signalsRef.current.geometry.attributes.position;
            const col = signalsRef.current.geometry.attributes.color;
            const siz = signalsRef.current.geometry.attributes.size;
            signals.forEach((sig, i) => {
                sig.progress += sig.speed * 0.014;
                if (sig.progress > 1.0) { sig.progress = -Math.random()*1.5; sig.curveIndex = Math.floor(Math.random()*curves.length); }
                const ep = sig.progress < 0 ? 0 : easeInOut(sig.progress);
                for (let j = 0; j < TRAIL_LENGTH; j++) {
                    const idx = i * TRAIL_LENGTH + j;
                    const tt = Math.max(0, ep - j * 0.035);
                    const p = curves[sig.curveIndex].getPointAt(tt);
                    pos.array[idx*3]=p.x; pos.array[idx*3+1]=p.y; pos.array[idx*3+2]=p.z;
                    const hue = 0.5 + Math.sin(t*2 + sig.offset)*0.1;
                    const color = new THREE.Color().setHSL(hue, 1, 0.7);
                    col.array[idx*3]=color.r; col.array[idx*3+1]=color.g; col.array[idx*3+2]=color.b;
                    siz.array[idx] = (0.08 * pulseSizeFactor * Math.pow(1-j/TRAIL_LENGTH, 2) * intensity) * (ep > 0 ? 1 : 0);
                }
            });
            pos.needsUpdate = true; col.needsUpdate = true; siz.needsUpdate = true;
        }

        groupRef.current.rotation.y = t * 0.03;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* V10: ALWAYS VISIBLE POWERFUL CORDS */}
            <points ref={cordsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={cordPositions.length/3} array={cordPositions} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={cordSizes.length} array={cordSizes} itemSize={1} />
                </bufferGeometry>
                <shaderMaterial
                    transparent depthWrite={false} blending={THREE.AdditiveBlending}
                    uniforms={{ uIntensity: { value: intensity }, uWidth: { value: lineWidthFactor }, uTime: { value: 0 } }}
                    vertexShader={`
                        attribute float size;
                        varying float vAlpha;
                        varying vec3 vPos;
                        void main() {
                            vAlpha = size;
                            vPos = position;
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = size * uWidth * (280.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        uniform float uIntensity;
                        uniform float uTime;
                        varying float vAlpha;
                        varying vec3 vPos;
                        void main() {
                            float d = distance(gl_PointCoord, vec2(0.5));
                            if (d > 0.5) discard;
                            
                            // Base visibility (Constant)
                            float base = 0.25;
                            // Running Pulse Wave
                            float dist = length(vPos);
                            float wave = sin(dist * 12.0 - uTime * 4.0) * 0.5 + 0.5;
                            float strength = base + wave * 0.4;

                            vec3 color = vec3(0.0, 0.8, 1.0); // Cyan Electric
                            gl_FragColor = vec4(color, vAlpha * strength * pow(1.0-d*2.0, 1.5) * uIntensity);
                        }
                    `}
                />
            </points>

            {/* SYNPSE NODES (Structure) */}
            <points ref={junctionsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={junctionPoints.length/3} array={junctionPoints} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial transparent opacity={0.4*intensity} color="#00ffff" size={0.012} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>

            {/* HIGH-VELOCITY SIGNALS */}
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
                            gl_PointSize = size * (500.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `}
                    fragmentShader={`
                        varying vec3 vColor;
                        void main() {
                            float d = distance(gl_PointCoord, vec2(0.5));
                            if (d > 0.5) discard;
                            gl_FragColor = vec4(vColor, pow(1.0 - d * 2.0, 2.5));
                        }
                    `}
                />
            </points>

            {/* MULTI-LAYER PULSING NUCLEUS */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.045, 32, 32]} />
                <meshBasicMaterial transparent opacity={0.8*intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={cageRef}>
                <icosahedronGeometry args={[0.052, 1]} />
                <meshBasicMaterial wireframe transparent opacity={0.3*intensity} color="#00ffff" blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={auraRef}>
                <planeGeometry args={[0.3, 0.3]} />
                <meshBasicMaterial 
                    transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} color="#00f2ff"
                    map={new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/glow.png')}
                />
            </mesh>

            <pointLight intensity={1.2 * intensity} color="#00f2ff" distance={3} />
        </group>
    );
};

export default SynapseCore;
