import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SynapseCore = ({ config, modelY }) => {
    const groupRef = useRef();
    const coreRef = useRef();
    const filamentsRef = useRef();

    const color = new THREE.Color(config.color || '#00f2ff');
    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const radius = config.radius || 0.35;
    const heightOffset = config.height || 0;

    // --- ORGANIC FILAMENTS GENERATION (V2) ---
    // We create arcs between random points on a sphere surface and inner points
    const { positions, opacities } = useMemo(() => {
        const lineCount = 18;
        const segmentsPerLine = 24;
        const totalPoints = lineCount * segmentsPerLine;
        const pos = new Float32Array(totalPoints * 3);
        const opac = new Float32Array(totalPoints);

        const r_int = radius * 0.4;
        const r_ext = radius;

        for (let i = 0; i < lineCount; i++) {
            // Start point near center
            const p1 = new THREE.Vector3().setFromSphericalCoords(
                Math.random() * r_int,
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2
            );

            // End point at surface
            const p2 = new THREE.Vector3().setFromSphericalCoords(
                r_ext,
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2
            );

            // Control point for curve (makes it organic)
            const pControl = new THREE.Vector3().lerpVectors(p1, p2, 0.5).add(
                new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(radius * 0.6)
            );

            const curve = new THREE.QuadraticBezierCurve3(p1, pControl, p2);
            const points = curve.getPoints(segmentsPerLine - 1);

            for (let j = 0; j < segmentsPerLine; j++) {
                const idx = (i * segmentsPerLine + j);
                pos[idx * 3] = points[j].x;
                pos[idx * 3 + 1] = points[j].y;
                pos[idx * 3 + 2] = points[j].z;
                // Opacity gradient along the line
                opac[idx] = Math.sin((j / segmentsPerLine) * Math.PI);
            }
        }

        return { positions: pos, opacities: opac };
    }, [radius]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime * speed;
        
        // Absolute Positioning
        groupRef.current.position.y = modelY + heightOffset;

        // Core Pulse
        if (coreRef.current) {
            const s = 0.95 + Math.sin(t * 2.0) * 0.05;
            coreRef.current.scale.setScalar(s * (config.scale || 1.0));
            coreRef.current.rotation.y = t * 0.2;
        }

        // Pulse logic for filaments
        if (filamentsRef.current) {
            const attr = filamentsRef.current.geometry.attributes.opacity;
            const lineCount = 18;
            const segmentsPerLine = 24;

            for (let i = 0; i < lineCount; i++) {
                // Moving pulse along the line
                const pulsePos = (t * 0.3 + (i * 0.123)) % 1.0;
                for (let j = 0; j < segmentsPerLine; j++) {
                    const idx = i * segmentsPerLine + j;
                    const u = j / segmentsPerLine;
                    const dist = Math.abs(u - pulsePos);
                    const pulse = Math.exp(-dist * 15.0) * 0.8;
                    const base = opacities[idx] * 0.15;
                    attr.array[idx] = (base + pulse) * intensity;
                }
            }
            attr.needsUpdate = true;
        }

        groupRef.current.rotation.y = t * 0.05;
    });

    if (!config.active) return null;

    return (
        <group ref={groupRef}>
            {/* Organic Filaments (V2 Arcs) */}
            <line ref={filamentsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                    <bufferAttribute attach="attributes-opacity" count={opacities.length} array={new Float32Array(opacities.length)} itemSize={1} />
                </bufferGeometry>
                <lineBasicMaterial 
                    color={color} 
                    transparent 
                    vertexColors={false} 
                    blending={THREE.AdditiveBlending} 
                    depthWrite={false}
                    onBeforeCompile={(shader) => {
                        shader.vertexShader = `
                            attribute float opacity;
                            varying float vOpacity;
                            ${shader.vertexShader}
                        `.replace('void main() {', 'void main() { vOpacity = opacity;');
                        shader.fragmentShader = `
                            varying float vOpacity;
                            ${shader.fragmentShader}
                        `.replace('gl_FragColor = vec4( diffuse, opacity );', 'gl_FragColor = vec4( diffuse, vOpacity );');
                    }}
                />
            </line>

            {/* Neural Heart (Intense Core) */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.6 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
                <mesh scale={1.5}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.2 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            </mesh>

            {/* Floating Information Particles */}
            <points frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.006} color={color} transparent opacity={0.3 * intensity} blending={THREE.AdditiveBlending} depthWrite={false} />
            </points>

            <pointLight intensity={0.5 * intensity} color={color} distance={1.0} />
        </group>
    );
};

export default SynapseCore;
