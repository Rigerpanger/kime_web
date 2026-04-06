/* [ignoring loop detection] */
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SoftwareSilhouette = ({ scene, config, modelY }) => {
    const active = config.active;
    const color = new THREE.Color(config.color || '#ffcc00');
    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const behavior = config.behavior || 'Static';
    const scaleOffset = 1.0 + (config.scale || 1.0) * 0.05;

    const silhouetteMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: color },
                uIntensity: { value: intensity },
                uBehavior: { value: behavior === 'Rain' ? 1.0 : behavior === 'Orbit' ? 2.0 : 0.0 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.BackSide,
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPos;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPos;
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uIntensity;
                uniform float uBehavior;

                void main() {
                    float fresnel = pow(1.0 - dot(vNormal, vec3(0,0,1)), 3.0);
                    float effect = 1.0;

                    if (uBehavior > 0.5 && uBehavior < 1.5) { // Rain
                        effect = step(0.9, fract(vWorldPos.y * 2.0 - uTime * 2.0));
                    } else if (uBehavior > 1.5) { // Orbit
                        effect = step(0.9, fract(atan(vWorldPos.z, vWorldPos.x) / 3.14159 + uTime));
                    }

                    gl_FragColor = vec4(uColor, fresnel * uIntensity * effect);
                }
            `
        });
    }, [color, intensity, behavior]);

    const silhouetteGroup = useMemo(() => {
        if (!scene) return null;
        const group = new THREE.Group();
        scene.traverse(node => {
            if (node.isMesh) {
                const mesh = new THREE.Mesh(node.geometry, silhouetteMaterial);
                mesh.position.copy(node.position);
                mesh.rotation.copy(node.rotation);
                mesh.scale.copy(node.scale).multiplyScalar(scaleOffset);
                group.add(mesh);
            }
        });
        return group;
    }, [scene, silhouetteMaterial, scaleOffset]);

    useFrame((state) => {
        if (!active || !silhouetteGroup) return;
        silhouetteMaterial.uniforms.uTime.value = state.clock.elapsedTime * speed;
    });

    if (!active || !silhouetteGroup) return null;

    return <primitive object={silhouetteGroup} />;
};

export default SoftwareSilhouette;
