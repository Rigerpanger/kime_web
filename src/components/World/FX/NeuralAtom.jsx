/* [ignoring loop detection] */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NeuralAtom = ({ config, modelY }) => {
    const active = config.active;
    const radius = config.radius || 1.5;
    const azimuth = (config.azimuth || 0) * (Math.PI / 180);
    const intensity = config.intensity || 1.0;
    const color = new THREE.Color(config.color || '#ffcc00');
    const speed = config.speed || 1.0;

    const groupRef = useRef();
    const coreRef = useRef();
    const electronsRef = useRef();

    const electronCount = 8;
    const electronData = useMemo(() => {
        const data = [];
        for (let i = 0; i < electronCount; i++) {
            data.push({
                orbitSpeed: 0.5 + Math.random() * 2,
                axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
                phase: Math.random() * Math.PI * 2
            });
        }
        return data;
    }, []);

    const tempObj = new THREE.Object3D();

    useFrame((state) => {
        if (!active || !groupRef.current) return;
        const t = state.clock.elapsedTime * speed;
        
        // Core animation
        if (coreRef.current) {
            coreRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
            coreRef.current.material.emissiveIntensity = intensity * (1.5 + Math.sin(t * 5) * 0.5);
        }

        // Position adjustment based on modelY and offset
        const centerPos = config.height ?? modelY ?? 5.1;
        groupRef.current.position.y = centerPos;
        groupRef.current.rotation.y = azimuth;

        // Electron animation
        if (electronsRef.current) {
            electronData.forEach((data, i) => {
                const orbitRadius = radius * (0.8 + Math.sin(t * 0.5 + i) * 0.2);
                const angle = t * data.orbitSpeed + data.phase;
                
                // Create orbit position
                const x = Math.cos(angle) * orbitRadius;
                const z = Math.sin(angle) * orbitRadius;
                
                tempObj.position.set(x, 0, z);
                tempObj.position.applyAxisAngle(data.axis, Math.sin(t * 0.1));
                tempObj.scale.setScalar(0.05 * (intensity * 0.5));
                tempObj.updateMatrix();
                electronsRef.current.setMatrixAt(i, tempObj.matrix);
            });
            electronsRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    if (!active) return null;

    return (
        <group ref={groupRef}>
            {/* Central energy core */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[0.3 * radius, 32, 32]} />
                <meshStandardMaterial 
                    color={color} 
                    emissive={color} 
                    emissiveIntensity={intensity}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Instanced Electrons */}
            <instancedMesh ref={electronsRef} args={[new THREE.SphereGeometry(1, 12, 12), null, electronCount]}>
                <meshStandardMaterial 
                    color={color} 
                    emissive={color} 
                    emissiveIntensity={intensity * 2}
                />
            </instancedMesh>

            {/* Orbit rings */}
            {electronData.slice(0, 3).map((data, i) => (
                <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[radius * 0.9, radius * 0.91, 64]} />
                    <meshBasicMaterial color={color} transparent opacity={0.1 * intensity} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </group>
    );
};

export default NeuralAtom;
