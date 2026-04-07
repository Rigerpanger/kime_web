/* [ignoring loop detection] */
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ShapeShifter = ({ scene, config, modelY }) => {
    const active = config.active;
    const intensity = config.intensity || 1.0;
    const speed = config.speed || 1.0;
    const behavior = config.behavior || 'Pulse';
    const mode = config.mode || 'Solid';
    const color = new THREE.Color(config.color || '#ffffff');

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: intensity },
                uSpeed: { value: speed },
                uColor: { value: color },
                uBehavior: { value: behavior === 'Pulse' ? 0 : behavior === 'Glitch' ? 1 : 2 }
            },
            transparent: mode === 'Solid' ? false : true,
            wireframe: mode === 'Wire',
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float uTime;
                uniform float uIntensity;
                uniform float uSpeed;
                uniform float uBehavior;

                void main() {
                    vNormal = normal;
                    vPosition = position;
                    vec3 pos = position;
                    float t = uTime * uSpeed;

                    if (uBehavior < 0.5) { // Pulse
                        pos += normal * sin(pos.y * 10.0 + t * 2.0) * 0.1 * uIntensity;
                    } else if (uBehavior < 1.5) { // Glitch
                        float g = step(0.9, sin(t * 10.0 + pos.y * 100.0));
                        pos += normal * g * 0.2 * uIntensity;
                    } else { // Float
                        pos.y += sin(pos.x * 5.0 + t) * 0.1 * uIntensity;
                        pos.x += cos(pos.z * 5.0 + t) * 0.1 * uIntensity;
                    }

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                uniform vec3 uColor;
                uniform float uIntensity;
                void main() {
                    float dotProd = dot(normalize(vNormal), vec3(0, 0, 1)) * 0.5 + 0.5;
                    gl_FragColor = vec4(uColor * dotProd * (0.5 + uIntensity * 0.5), 1.0);
                }
            `
        });
    }, [intensity, speed, behavior, mode, color]);

    const warpedGroup = useMemo(() => {
        if (!scene) return null;
        const cloned = scene.clone();
        cloned.traverse(node => {
            if (node.isMesh && node.geometry && node.geometry.attributes.position) {
                // Ignore small helper/null objects from the GLTF
                if (node.name.toLowerCase().includes('pivot') || node.name.toLowerCase().includes('null')) return;

                node.material = shaderMaterial;
            }
        });
        return cloned;
    }, [scene, shaderMaterial]);

    useFrame((state) => {
        if (!active || !warpedGroup) return;
        shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        shaderMaterial.uniforms.uIntensity.value = intensity;
        shaderMaterial.uniforms.uSpeed.value = speed;
        shaderMaterial.uniforms.uColor.value = color;
    });

    if (!active || !morphedGroup) return null;

    return <primitive object={morphedGroup} />;
};

export default ShapeShifter;
