import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useAppStore, { VIEWS } from '../../store/useAppStore';

const CameraRig = () => {
    const { camera, controls } = useThree();
    const view = useAppStore(s => s.view);
    const activeSlug = useAppStore(s => s.activeSlug);
    const config = useAppStore(s => s.sculptureConfig);
    const showStudioEditor = useAppStore(s => s.showStudioEditor);
    const isOrbiting = useAppStore(s => s.isOrbiting);
    const activeCameraId = useAppStore(s => s.activeCameraId);

    const vecPos = new THREE.Vector3();
    const vecTarget = new THREE.Vector3();

    // Listen to capture triggers
    const captureTrigger = useAppStore(s => s.captureTrigger);
    const updateCamera = useAppStore(s => s.updateCamera);

    useEffect(() => {
        if (captureTrigger > 0) {
            // Calculate orbital parameters from current camera and controls
            const target = controls?.target ? controls.target.clone() : new THREE.Vector3(0,0,0);
            const pos = camera.position.clone();
            
            const radius = pos.distanceTo(target);
            const deltaVec = new THREE.Vector3().subVectors(pos, target);
            
            // Polar angle (0 to PI -> 0 to 180 degrees)
            const polar = (Math.acos(deltaVec.y / radius) * 180) / Math.PI;
            // Azimuthal angle (-PI to PI -> -180 to 180 degrees)
            const azimuth = (Math.atan2(deltaVec.x, deltaVec.z) * 180) / Math.PI;

            const updateSectionCamera = useAppStore.getState().updateSectionCamera;
            const currentSection = config.sections?.[activeSlug] || config.sections?.default;
            
            // Allow capture mapping strictly to activeSlug
            if (activeSlug) {
                updateSectionCamera(activeSlug, {
                    pivotX: target.x,
                    pivotY: target.y,
                    pivotZ: target.z,
                    radius: isNaN(radius) ? 16 : radius,
                    polar: isNaN(polar) ? 90 : polar,
                    azimuth: isNaN(azimuth) ? 0 : azimuth
                });
                console.log("Captured Orbital View for Section:", activeSlug);
            }
        }
    }, [captureTrigger, activeSlug, config.sections]);

    useFrame((state, delta) => {
        // If the user uses OrbitControls mouse interaction in editor, pause smoothing
        if (isOrbiting && showStudioEditor) return;

        let targetPos = [0, 0, 16];
        let targetLook = [0, 0, 0];
        let lerpSpeed = 1.5;

        // Determine Section Context
        if (view === VIEWS.HOME && !showStudioEditor) {
            targetPos = [0, 0, 18];
            targetLook = [0, 0, 0];
        } else {
            // Read Camera connected to the active website section directly
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
                // Spherical to Cartesian relative to Pivot
                targetPos = [
                    px + r * Math.sin(phi) * Math.sin(theta),
                    py + r * Math.cos(phi),
                    pz + r * Math.sin(phi) * Math.cos(theta)
                ];
                lerpSpeed = 2.0;

                // When in Studio Editor and values jump, applying a faster lerp prevents lag
                if (showStudioEditor) lerpSpeed = 6.0;
            } else {
                targetPos = [0, 0, 14];
                targetLook = [0, 0, 0];
            }
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
