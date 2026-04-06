/* [ignoring loop detection] */
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GeoSwarm = ({ config, modelY }) => {
    const count = Math.min(2000, config.density || 600);
    const variety = Math.min(6, config.variety || 3);
    const radius = config.radius || 4.5;
    const speed = config.speed || 1.0;
    const scale = config.scale || 1.0;
    const color = new THREE.Color(config.color || '#ffcc00');

    const groupRef = useRef();
    const meshRefs = [];

    const geoOptions = useMemo(() => [
        new THREE.TetrahedronGeometry(0.12),
        new THREE.IcosahedronGeometry(0.08),
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.OctahedronGeometry(0.1),
        new THREE.DodecahedronGeometry(0.1),
        new THREE.ConeGeometry(0.08, 0.16)
    ].slice(0, variety), [variety]);

    const instances = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            const r = radius * (0.8 + Math.random() * 0.4);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            data.push({
                pos: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)),
                rot: new THREE.Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
                speed: 0.5 + Math.random() * 1.5,
                geoIdx: Math.floor(Math.random() * variety)
            });
        }
        return data;
    }, [count, variety, radius]);

    const tempObj = new THREE.Object3D();

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime * speed;
        const centerOffset = config.height ?? modelY ?? 5.1;
        groupRef.current.position.y = centerOffset;

        geoOptions.forEach((_, idx) => {
            const mesh = meshRefs[idx];
            if (!mesh) return;
            let counter = 0;
            instances.forEach((inst) => {
                if (inst.geoIdx !== idx) return;
                const orbitSpeed = inst.speed * 0.2;
                const x = inst.pos.x * Math.cos(t * orbitSpeed) - inst.pos.z * Math.sin(t * orbitSpeed);
                const z = inst.pos.x * Math.sin(t * orbitSpeed) + inst.pos.z * Math.cos(t * orbitSpeed);
                const y = inst.pos.y + Math.sin(t * inst.speed) * 0.5;

                tempObj.position.set(x, y, z);
                tempObj.rotation.set(inst.rot.x + t, inst.rot.y + t * 0.5, inst.rot.z);
                tempObj.scale.setScalar(scale);
                tempObj.updateMatrix();
                mesh.setMatrixAt(counter++, tempObj.matrix);
            });
            mesh.instanceMatrix.needsUpdate = true;
        });
    });

    return (
        <group ref={groupRef}>
            {geoOptions.map((geo, i) => {
                const instanceCount = instances.filter(inst => inst.geoIdx === i).length;
                return (
                    <instancedMesh key={i} ref={el => meshRefs[i] = el} args={[geo, null, instanceCount]}>
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} metalness={0.8} roughness={0.2} />
                    </instancedMesh>
                );
            })}
        </group>
    );
};

export default GeoSwarm;
