/* [ignoring loop detection] */
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Iris = ({ scene, config, modelY }) => {
    const active = config.active;
    const intensity = config.intensity || 1.0;
    const presetIndex = config.presetIndex || 0;
    const speed = config.speed || 1.0;

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: intensity },
                uPreset: { value: presetIndex },
                uSpeed: { value: speed }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewVec;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewVec = normalize(-mvPosition.xyz);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vViewVec;
                uniform float uTime;
                uniform float uIntensity;
                uniform float uPreset;
                uniform float uSpeed;

                void main() {
                    float fresnel = pow(1.0 - dot(vNormal, vViewVec), 3.0);
                    vec3 color = vec3(0.0);
                    float t = uTime * uSpeed;
                    if (uPreset < 0.5) {
                        color = 0.5 + 0.5 * cos(t + vec3(0, 2, 4) + vNormal.y * 5.0);
                    } else if (uPreset < 1.5) {
                        float p = sin(t * 3.0) * 0.5 + 0.5;
                        color = vec3(p, p * 0.2, p * 0.8);
                    } else if (uPreset < 2.5) {
                        color = vec3(0.8, 0.9, 1.0) * (0.5 + 0.5 * sin(vNormal.x * 10.0 + t));
                    } else {
                        float g = step(0.98, fract(sin(t * 10.0) * 43758.5453));
                        color = vec3(g, 0.0, g * 0.5);
                    }
                    gl_FragColor = vec4(color * fresnel * uIntensity, fresnel * uIntensity * 0.5);
                }
            `
        });
    }, [intensity, presetIndex, speed]);

    const irisGroup = useMemo(() => {
        if (!scene) return null;
        const group = new THREE.Group();
        scene.traverse(node => {
            if (node.isMesh) {
                const irisMesh = new THREE.Mesh(node.geometry, shaderMaterial);
                irisMesh.position.copy(node.position);
                irisMesh.rotation.copy(node.rotation);
                irisMesh.scale.copy(node.scale).multiplyScalar(1.02);
                irisMesh.renderOrder = 10;
                group.add(irisMesh);
            }
        });
        return group;
    }, [scene, shaderMaterial]);

    useFrame((state) => {
        if (!active || !irisGroup) return;
        shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        shaderMaterial.uniforms.uIntensity.value = intensity;
        shaderMaterial.uniforms.uPreset.value = presetIndex.value !== undefined ? presetIndex.value : presetIndex;
        shaderMaterial.uniforms.uSpeed.value = speed;
    });

    if (!active || !irisGroup) return null;
    return <primitive object={irisGroup} position={[0, 0, 0]} />;
};

export default Iris;
