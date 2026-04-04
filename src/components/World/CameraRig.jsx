import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore from '../../store/useAppStore';

const CameraRig = () => {
    const { camera, controls } = useThree();
    const activeSlug = useAppStore(s => s.activeSlug) || 'default';
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const isOrbiting = useAppStore(s => s.isOrbiting);

    const vecPos = new THREE.Vector3();
    const vecTarget = new THREE.Vector3();

    useFrame((state, delta) => {
        // If the user uses OrbitControls mouse interaction in editor, pause smoothing
        if (isOrbiting && showStudioEditor) return;

        let targetPos = [0, 0, 16];
        let targetLook = [0, 0, 0];
        let lerpSpeed = 2.0;

        // Determine Section Context
        const currentSection = config.sections?.[activeSlug] || config.sections?.default;
        let activeCam = currentSection?.camera;
            
        // Legacy Migration on the fly
        if (activeCam && activeCam.pos && activeCam.azimuth === undefined) {
            const dx = activeCam.pos[0] - (activeCam.target?.[0] || 0);
            const dy = activeCam.pos[1] - (activeCam.pivotY !== undefined ? activeCam.pivotY : 0);
            const dz = activeCam.pos[2] - (activeCam.target?.[2] || 0);
            const radius = activeCam.zoom || Math.sqrt(dx*dx + dy*dy + dz*dz) || 16;
            activeCam = {
                azimuth: isNaN(Math.atan2(dx, dz) * 180 / Math.PI) ? 0 : Math.atan2(dx, dz) * 180 / Math.PI,
                polar: isNaN(Math.acos(dy / radius) * 180 / Math.PI) ? 90 : Math.acos(dy / radius) * 180 / Math.PI,
                radius: radius,
                pivotX: activeCam.target?.[0] || 0,
                pivotY: activeCam.pivotY !== undefined ? activeCam.pivotY : 0,
                pivotZ: activeCam.target?.[2] || 0
            };
        }

        if (activeCam) {
            const theta = (activeCam.azimuth || 0) * Math.PI / 180;
            const phi = (activeCam.polar !== undefined ? activeCam.polar : 90) * Math.PI / 180;
            const r = activeCam.radius || 16;
            const px = activeCam.pivotX || 0;
            const py = activeCam.pivotY !== undefined ? activeCam.pivotY : 0;
            const pz = activeCam.pivotZ || 0;
            
            targetLook = [px, py, pz];
            targetPos = [
                px + r * Math.sin(phi) * Math.sin(theta),
                py + r * Math.cos(phi),
                pz + r * Math.sin(phi) * Math.cos(theta)
            ];

            // Faster LERP in editor for real-time slider feedback
            if (showStudioEditor) {
                lerpSpeed = 8.0; 
            }
        } else {
            targetPos = [0, 0, 14];
            targetLook = [0, 0, 0];
        }

        // Apply Smoothing
        vecPos.set(...targetPos);
        camera.position.lerp(vecPos, delta * lerpSpeed);

        vecTarget.set(...targetLook);
        if (controls) {
            controls.target.lerp(vecTarget, delta * lerpSpeed);
            controls.update();
        } else {
            camera.lookAt(vecTarget);
        }
    });

    return null;
};

export default CameraRig;
