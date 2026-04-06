/* [ignoring loop detection] */
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const HoloGrid = ({ scene, config, modelY }) => {
    const active = config.active;
    const color = new THREE.Color(config.color || '#ffffff');
    const density = config.density || 20;
    const thickness = config.thickness || 0.08;
    const patternIndex = config.patternIndex || 0;

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: color },
                uTime: { value: 0 },
                uDensity: { value: density },
                uThickness: { value: thickness },
                uPattern: { value: patternIndex }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPos;
                void main() {
                    vUv = uv;
                    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vWorldPos;
                uniform vec3 uColor;
                uniform float uTime;
                uniform float uDensity;
                uniform float uThickness;
                uniform float uPattern;

                void main() {
                    vec2 grid = fract(vUv * uDensity + uTime * 0.1);
                    float line = 0.0;
                    if (uPattern < 0.5) {
                        line = step(1.0 - uThickness, grid.x) + step(1.0 - uThickness, grid.y);
                    } else if (uPattern < 1.5) {
                        grid = fract(vUv * uDensity * vec2(1.0, 1.73) + uTime * 0.05);
                        line = step(1.0 - uThickness, grid.x) + step(1.0 - uThickness, grid.y);
                    } else {
                        line = 1.0 - smoothstep(uThickness, uThickness + 0.1, distance(grid, vec2(0.5)));
                    }
                    float scanline = sin(vWorldPos.y * 10.0 + uTime * 5.0) * 0.5 + 0.5;
                    gl_FragColor = vec4(uColor, line * (0.3 + scanline * 0.7));
                }
            `
        });
    }, [color, density, thickness, patternIndex]);

    const gridGroup = useMemo(() => {
        if (!scene) return null;
        const group = new THREE.Group();
        scene.traverse(node => {
            if (node.isMesh) {
                const gridMesh = new THREE.Mesh(node.geometry, shaderMaterial);
                gridMesh.position.copy(node.position);
                gridMesh.rotation.copy(node.rotation);
                gridMesh.scale.copy(node.scale).multiplyScalar(1.005);
                group.add(gridMesh);
            }
        });
        return group;
    }, [scene, shaderMaterial]);

    useFrame((state) => {
        if (!active || !gridGroup) return;
        shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        shaderMaterial.uniforms.uColor.value = color;
        shaderMaterial.uniforms.uDensity.value = density;
        shaderMaterial.uniforms.uThickness.value = thickness;
        shaderMaterial.uniforms.uPattern.value = patternIndex.value !== undefined ? patternIndex.value : patternIndex;
    });

    if (!active || !gridGroup) return null;
    return <primitive object={gridGroup} position={[0, 0, 0]} />;
};

export default HoloGrid;
