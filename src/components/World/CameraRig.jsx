import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore from '../../store/useAppStore';
import useActiveSlug from '../../hooks/useActiveSlug';

const CameraRig = () => {
    const { camera, controls } = useThree();
    const activeSlug = useActiveSlug();
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const isOverPanel = useAppStore(s => s.isOverPanel);
    const isOrbiting = useAppStore(s => s.isOrbiting);
 
    const vecPos = new THREE.Vector3();
    const vecTarget = new THREE.Vector3();
    const lastSlug = useRef(activeSlug);
    const isTransitioning = useRef(false);
 
    // Use a ref for reactive state within useFrame to avoid stale closure issues
    const stateRef = useRef({ activeSlug, config, showStudioEditor, isOverPanel });
    stateRef.current = { activeSlug, config, showStudioEditor, isOverPanel };

    useFrame((state, delta) => {
        const { activeSlug: currentSlug, config: currentConfig, showStudioEditor: isEditing, isOverPanel: overPanel } = stateRef.current;

        // --- SECTION TRACKING ---
        if (lastSlug.current !== currentSlug) {
            lastSlug.current = currentSlug;
            isTransitioning.current = true;
        }

        // --- ORBIT OVERRIDE ---
        if (isEditing && isOrbiting) {
            isTransitioning.current = false;
            return; 
        }

        const currentSection = currentConfig.sections?.[currentSlug] || currentConfig.sections?.default;
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
            const py = (activeCam.pivotY !== undefined ? activeCam.pivotY : currentSection?.modelY ?? 5.1) + (currentConfig.y || 0);
            const pz = activeCam.pivotZ || 0;
            
            const targetLookArr = [px, py, pz];
            const targetPosArr = [
                px + r * Math.sin(phi) * Math.sin(theta),
                py + r * Math.cos(phi),
                pz + r * Math.sin(phi) * Math.cos(theta)
            ];

            // Safety check for NaN
            if (isNaN(targetPosArr[0]) || isNaN(targetPosArr[1]) || isNaN(targetPosArr[2])) {
                targetPosArr[0] = 0; targetPosArr[1] = 5.1; targetPosArr[2] = 18;
                targetLookArr[0] = 0; targetLookArr[1] = 5.1; targetLookArr[2] = 0;
            }

            // --- CINEMATIC SMOOTHING (HEAVY/EXPENSIVE FEEL) ---
            // We use a high damping value (smaller number in DAMP is actually slower/smoother)
            // For a 'heavy' cinematic feel, we use 1.0.
            const transitionSmoothing = 1.0; 
            const editorSmoothing = 4.0; // Sliders respond faster
            const s = isEditing ? editorSmoothing : transitionSmoothing;
            const d = Math.max(0.001, Math.min(0.2, delta || 0.016));

            // Apply movement (Independent axes for buttery glide)
            camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPosArr[0], s, d);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPosArr[1], s, d);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPosArr[2], s, d);

            if (controls) {
                controls.target.x = THREE.MathUtils.damp(controls.target.x, targetLookArr[0], s, d);
                controls.target.y = THREE.MathUtils.damp(controls.target.y, targetLookArr[1], s, d);
                controls.target.z = THREE.MathUtils.damp(controls.target.z, targetLookArr[2], s, d);
                // We keep controls.update() to sync camera matrix
                controls.update();
            } else {
                vecTarget.set(...targetLookArr);
                camera.lookAt(vecTarget);
            }

            return;
        }
    });

    return null;
};

export default CameraRig;
