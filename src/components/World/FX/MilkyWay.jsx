import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MilkyWay = ({ config = {} }) => {
    const {
        active = true,
        intensity = 1.2,
        color = '#2a0050',
        starDensity = 0.5 
    } = config;

    const meshRef = useRef();

    const nebulaMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false, 
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: intensity },
                uBaseColor: { value: new THREE.Color(color) },
                uStarDensity: { value: starDensity }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPos;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uIntensity;
                uniform vec3 uBaseColor;
                uniform float uStarDensity;
                varying vec3 vNormal;
                varying vec3 vWorldPos;

                float hash(vec3 p) {
                    p = fract(p * vec3(123.34, 456.21, 789.18));
                    p += dot(p, p.yzx + 45.32);
                    return fract((p.x + p.y) * p.z);
                }

                float noise(vec3 p) {
                    vec3 i = floor(p);
                    vec3 f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(
                        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
                    );
                }

                float fbm(vec3 p) {
                    float v = 0.0;
                    float a = 0.5;
                    mat3 m = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
                    for (int i = 0; i < 5; i++) {
                        v += a * noise(p);
                        p = m * p * 2.1;
                        a *= 0.5;
                    }
                    return v;
                }

                void main() {
                    vec3 dir = normalize(vWorldPos);
                    
                    float n1 = fbm(dir * 2.2 + uTime * 0.001);
                    float n2 = fbm(dir * 3.5 - uTime * 0.001); 
                    
                    float nebulaMask = pow(n1, 2.5) * 1.2;
                    float subMask = pow(n2, 3.0) * 1.5;
                    
                    vec3 blueCol = mix(uBaseColor * 0.2, vec3(0.1, 0.3, 0.8), nebulaMask);
                    vec3 pinkCol = mix(vec3(0.6, 0.1, 0.5), vec3(0.9, 0.4, 0.1) * 0.7, subMask);
                    vec3 nebulaCol = mix(blueCol, pinkCol, subMask * 0.5);
                    
                    float dustFinal = pow(fbm(dir * 4.0 + 30.0), 2.5);
                    nebulaCol *= (1.0 - dustFinal * 0.7);
                    
                    float s1 = pow(hash(dir * 150.0), 1200.0) * 50.0; 
                    float s2 = pow(hash(dir * 300.0), 1800.0) * 80.0;
                    float starVal = max(0.0, (s1 + s2) * uStarDensity);
                    starVal = smoothstep(0.05, 0.8, starVal); 
                    
                    float visibilityThreshold = 1.0 - clamp(uStarDensity * 1.5, 0.0, 1.0);
                    vec3 finalStars = max(vec3(0.0), vec3(starVal) - visibilityThreshold * 0.4);
                    finalStars *= 0.5;

                    float disk = pow(1.0 - abs(dir.y), 18.0);
                    vec3 coreGlow = vec3(1.0, 0.85, 0.7) * disk * 0.4;

                    vec3 finalCol = (nebulaCol * (nebulaMask + 0.15)) + finalStars + coreGlow;
                    gl_FragColor = vec4(finalCol * uIntensity, 1.0);
                }
            `
        });
    }, []);

    useEffect(() => {
        return () => nebulaMaterial.dispose();
    }, [nebulaMaterial]);

    useFrame((state) => {
        if (!active || !meshRef.current) return;
        nebulaMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        nebulaMaterial.uniforms.uIntensity.value = intensity;
        nebulaMaterial.uniforms.uBaseColor.value.set(color);
        nebulaMaterial.uniforms.uStarDensity.value = starDensity;
        meshRef.current.rotation.y = 0; 
    });

    if (!active) return null;

    return (
        <mesh ref={meshRef} material={nebulaMaterial} frustumCulled={false}>
            <sphereGeometry args={[145, 32, 32]} />
        </mesh>
    );
};

export default MilkyWay;
