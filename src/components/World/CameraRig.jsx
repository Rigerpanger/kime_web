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
    const isOrbiting = useAppStore(s => s.isOrbiting);
 
    const vecPos = new THREE.Vector3();
    const vecTarget = new THREE.Vector3();
    const lastSlug = useRef(activeSlug);
 
    useFrame((state, delta) => {
        // --- EDITOR OVERRIDE ---
        // If the editor is open, we only lerp when the section (slug) changes.
        // Otherwise, the user has 100% manual freedom with their mouse.
        if (showStudioEditor) {
           if (lastSlug.current !== activeSlug) {
              // We'll allow one transition, then stay manual
              lastSlug.current = activeSlug;
           } else {
              // Stay in manual mode to prevent "fighting" the mouse
              return;
           }
        } else {
           lastSlug.current = activeSlug;
        }

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
            const r = activeCam.radius || 18;
            const px = activeCam.pivotX || 0;
            const py = activeCam.pivotY !== undefined ? activeCam.pivotY : (currentSection?.modelY ?? 5.1);
            const pz = activeCam.pivotZ || 0;
            
            targetLook = [px, py, pz];
            targetPos = [
                px + r * Math.sin(phi) * Math.sin(theta),
                py + r * Math.cos(phi),
                pz + r * Math.sin(phi) * Math.cos(theta)
            ];

            // Safety check for NaN
            if (isNaN(targetPos[0]) || isNaN(targetPos[1]) || isNaN(targetPos[2])) {
                targetPos = [0, 5.1, 18];
                targetLook = [0, 5.1, 0];
            }

            // Cinematic Smoothing using damp
            const smoothing = isOverPanel ? 12.0 : 3.5; 
            const d = Math.max(0.001, Math.min(0.2, delta || 0.016)); // Clamp delta for stability
            
            // EMERGENCY Recovery if camera is already at NaN
            if (isNaN(camera.position.x)) {
                camera.position.set(...targetPos);
            } else {
                camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos[0], smoothing, d);
                camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos[1], smoothing, d);
                camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos[2], smoothing, d);
            }

            // Apply Target Smoothing
            if (controls) {
                if (isNaN(controls.target.x)) {
                    controls.target.set(...targetLook);
                } else {
                    controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLook[0], smoothing, d);
                    controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLook[1], smoothing, d);
                    controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLook[2], smoothing, d);
                }
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
