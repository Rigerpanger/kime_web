/* [ignoring loop detection] */
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NeonEdges = ({ scene, config, modelY }) => {
    const active = config.active;
    const color = new THREE.Color(config.color || '#ffcc00');
    const intensity = config.intensity || 1.0;
    const rainbow = config.rainbow || false;

    const wireframeGroup = useMemo(() => {
        if (!scene) return null;
        const group = new THREE.Group();
        scene.traverse(node => {
            if (node.isMesh) {
                const wireframe = new THREE.Mesh(node.geometry, new THREE.MeshBasicMaterial({
                    color: color,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.5,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    depthTest: true,
                    polygonOffset: true,
                    polygonOffsetFactor: -1,
                    renderOrder: 5
                }));
                wireframe.position.copy(node.position);
                wireframe.rotation.copy(node.rotation);
                wireframe.scale.copy(node.scale).multiplyScalar(1.002);
                group.add(wireframe);
            }
        });
        return group;
    }, [scene, color]);

    useFrame((state) => {
        if (!active || !wireframeGroup) return;
        const t = state.clock.elapsedTime;
        
        wireframeGroup.traverse(node => {
            if (node.isMesh) {
                if (rainbow) {
                    node.material.color.setHSL((t * 0.1 + node.uuid.charCodeAt(0) * 0.01) % 1, 0.8, 0.5);
                } else {
                    node.material.color.copy(color);
                }
                node.material.opacity = (0.2 + Math.sin(t * 2) * 0.1) * intensity;
            }
        });
    });

    if (!active || !wireframeGroup) return null;

    return <primitive object={wireframeGroup} position={[0, 0, 0]} />;
};

export default NeonEdges;
