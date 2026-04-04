import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore from '../../store/useAppStore';

const CameraRig = () => {
    const { camera, controls } = useThree();
    const activeSlug = useAppStore(s => s.activeSlug) || 'default';
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const isOverPanel = useAppStore(s => s.isOverPanel);
 
    const vecPos = new THREE.Vector3();
    const vecTarget = new THREE.Vector3();
 
    useFrame((state, delta) => {
        // If the user uses OrbitControls mouse interaction in editor, pause smoothing
        // UNLESS we are currently over the panel (adjusting sliders)
        if (isOrbiting && showStudioEditor && !isOverPanel) return;

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

            // Cinematic Smoothing using damp
            const smoothing = isOverPanel ? 12.0 : 3.5; 
            
            // Apply Position Smoothing
            camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos[0], smoothing, delta);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos[1], smoothing, delta);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos[2], smoothing, delta);

            // Apply Target Smoothing
            if (controls) {
                controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLook[0], smoothing, delta);
                controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLook[1], smoothing, delta);
                controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLook[2], smoothing, delta);
                controls.update();
            } else {
                vecTarget.set(...targetLook);
                camera.lookAt(vecTarget);
            }
            return;
        }
    });

    return null;
};

export default CameraRig;
