import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const VIEWS = {
  HOME: 'HOME',
  SERVICES: 'SERVICES',
  SERVICE_DETAIL: 'SERVICE_DETAIL',
  PROJECTS: 'PROJECTS',
  ABOUT: 'ABOUT',
  CONTACT: 'CONTACT',
};

const DEFAULT_CAMERAS = [
  { id: 'cam-main', name: 'Front View', azimuth: 0, polar: 90, radius: 18, pivotX: 0, pivotY: 0, pivotZ: 0 },
  { id: 'cam-top', name: 'High Angle', azimuth: 45, polar: 45, radius: 20, pivotX: 0, pivotY: 2, pivotZ: 0 },
  { id: 'cam-close', name: 'Close Up', azimuth: -30, polar: 80, radius: 12, pivotX: 0, pivotY: 5, pivotZ: 0 }
];

function migrateOldCamera(oldCam) {
    if (!oldCam || !oldCam.pos) return { ...DEFAULT_CAMERAS[0], id: `cam-m-${Math.random()}` };
    const px = oldCam.pos[0], py = oldCam.pos[1], pz = oldCam.pos[2];
    const tx = oldCam.target?.[0] || 0;
    const ty = oldCam.pivotY !== undefined ? oldCam.pivotY : (oldCam.target?.[1] || 0);
    const tz = oldCam.target?.[2] || 0;
    
    const dx = px - tx;
    const dy = py - ty;
    const dz = pz - tz;
    
    const radius = oldCam.zoom || Math.sqrt(dx*dx + dy*dy + dz*dz) || 16;
    let polar = Math.acos(dy / radius) * 180 / Math.PI;
    let azimuth = Math.atan2(dx, dz) * 180 / Math.PI;
    
    return {
        id: `cam-migrated-${Math.random().toString(36).substr(2, 5)}`,
        name: 'Migrated View',
        azimuth: isNaN(azimuth) ? 0 : azimuth,
        polar: isNaN(polar) ? 90 : polar,
        radius: radius,
        pivotX: tx, pivotY: ty, pivotZ: tz
    };
}


const DEFAULT_SECTIONS = {
  "default": {
    camera: { azimuth: 0, polar: 90, radius: 18, pivotX: 0, pivotY: 12.5, pivotZ: 0 },
    fx: Array(5).fill(0).map((_, i) => ({ id: `${i+1}`, type: 'None', active: false }))
  }
};

const useAppStore = create(
  persist(
    (set) => ({
      view: VIEWS.HOME,
      hoveredChunk: null,
      activeSlug: null,
      sculptureConfig: {
        y: 5.1,
        scale: 17.0,
        rotationY: 248,
        roughness: 0.85,
        metalness: 0,
        envMapIntensity: 0.02,
        emissiveIntensity: 1.0,
        bloomIntensity: 0.2,
        bloomRadius: 0.2,
        hdriUrl: null,
        mouseLightIntensity: 150,
        lights: [
          { id: '1', name: 'Main Spot', intensity: 600, color: '#ffffff', y: 30, radius: 0, azimuth: 0 },
          { id: '2', name: 'Back Rim', intensity: 400, color: '#ffffff', y: 8, radius: 6, azimuth: 180 }
        ],
        cameras: DEFAULT_CAMERAS,
        sections: DEFAULT_SECTIONS,
        flashFX: { y: 4.8, distance: 1.2, intensity: 40 }
      },
      activeLightId: '1',
      activeCameraId: 'cam-main',

      showStudioEditor: false,
      isModalOpen: false,
      isScrollLocked: false,
      isOrbiting: false,

      setView: (view) => set({ view }),
      setOrbiting: (status) => set({ isOrbiting: status }),
      setHoveredChunk: (chunkId) => set({ hoveredChunk: chunkId }),
      setActiveSlug: (slug) => set({ activeSlug: slug }),
      
      setSculptureConfig: (newConfig) => set((state) => {
        // Migration & Merge Logic
        let merged = { ...state.sculptureConfig, ...newConfig };
        
        // Ensure cameras array exists
        if (!merged.cameras || !merged.cameras.length) {
            merged.cameras = JSON.parse(JSON.stringify(DEFAULT_CAMERAS));
        }
        
        if (!merged.sections) merged.sections = JSON.parse(JSON.stringify(DEFAULT_SECTIONS));

        // Migrate Old sections explicitly wrapping camera objects into global cameras list
        Object.entries(merged.sections).forEach(([slug, section]) => {
            if (section.camera && !section.cameraId) {
                const migrated = migrateOldCamera(section.camera);
                migrated.name = `View: ${slug}`;
                merged.cameras.push(migrated);
                section.cameraId = migrated.id;
                delete section.camera; 
            }
        });

        // Deep merge legacy FX
        if (newConfig.aiFX) merged.sections['ai-ml'].fx[0] = { ...merged.sections['ai-ml'].fx[0], ...newConfig.aiFX };
        if (newConfig.arFX) merged.sections['ar-vr'].fx[0] = { ...merged.sections['ar-vr'].fx[0], ...newConfig.arFX };
        if (newConfig.softwareFX) merged.sections['software-dev'].fx[0] = { ...merged.sections['software-dev'].fx[0], ...newConfig.softwareFX };
        if (newConfig.gamedevFX) merged.sections['gamedev'].fx[0] = { ...merged.sections['gamedev'].fx[0], ...newConfig.gamedevFX };

        return { sculptureConfig: merged };
      }),

      setShowStudioEditor: (show) => set({ showStudioEditor: show }),
      setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
      setScrollLocked: (isLocked) => set({ isScrollLocked: isLocked }),
      captureTrigger: 0,
      triggerCapture: () => set(state => ({ captureTrigger: state.captureTrigger + 1 })),
      
      setActiveLightId: (id) => set({ activeLightId: id }),
      addLight: () => set((state) => {
         const newId = `light-${Date.now()}`;
         return {
            sculptureConfig: {
               ...state.sculptureConfig,
               lights: [...(state.sculptureConfig.lights || []), {
                  id: newId, name: `Light ${(state.sculptureConfig.lights?.length || 0) + 1}`,
                  intensity: 500, color: '#ffffff', y: 10, radius: 10, azimuth: 0
               }]
            },
            activeLightId: newId
         };
      }),
      removeLight: (id) => set((state) => {
         const remaining = (state.sculptureConfig.lights || []).filter(l => l.id !== id);
         return {
            sculptureConfig: {
               ...state.sculptureConfig,
               lights: remaining
            },
            activeLightId: remaining.length > 0 ? remaining[0].id : null
         };
      }),
      updateLight: (id, updates) => set((state) => ({
         sculptureConfig: {
            ...state.sculptureConfig,
            lights: (state.sculptureConfig.lights || []).map(l => l.id === id ? { ...l, ...updates } : l)
         }
      })),

      setActiveCameraId: (id) => set({ activeCameraId: id }),
      addCamera: () => set((state) => {
         const newId = `cam-${Date.now()}`;
         return {
            sculptureConfig: {
               ...state.sculptureConfig,
               cameras: [...(state.sculptureConfig.cameras || []), {
                  id: newId, name: `Cam ${(state.sculptureConfig.cameras?.length || 0) + 1}`,
                  azimuth: 0, polar: 90, radius: 16, pivotX: 0, pivotY: 5.1, pivotZ: 0
               }]
            },
            activeCameraId: newId
         };
      }),
      removeCamera: (id) => set((state) => {
         const remaining = (state.sculptureConfig.cameras || []).filter(c => c.id !== id);
         return {
            sculptureConfig: {
               ...state.sculptureConfig,
               cameras: remaining
            },
            activeCameraId: remaining.length > 0 ? remaining[0].id : null
         };
      }),
      updateCamera: (id, updates) => set((state) => ({
         sculptureConfig: {
            ...state.sculptureConfig,
            cameras: (state.sculptureConfig.cameras || []).map(c => c.id === id ? { ...c, ...updates } : c)
         }
      })),

      // NEW: Section-specific updates
      updateSectionCamera: (slug, updates) => set((state) => {
          const activeKey = slug || 'default';
          const sections = JSON.parse(JSON.stringify(state.sculptureConfig.sections || DEFAULT_SECTIONS));
          if (!sections[activeKey]) sections[activeKey] = JSON.parse(JSON.stringify(DEFAULT_SECTIONS.default));
          
          sections[activeKey].camera = { 
              ...(sections[activeKey].camera || {}), 
              ...updates 
          };
          
          if (updates.azimuth !== undefined) {
             delete sections[activeKey].camera.pos;
             delete sections[activeKey].camera.target;
             delete sections[activeKey].camera.zoom;
          }

          return { sculptureConfig: { ...state.sculptureConfig, sections } };
      }),

      updateSectionCameraId: (slug, cameraId) => set((state) => {
          const sections = { ...state.sculptureConfig.sections };
          if (!sections[slug]) sections[slug] = JSON.parse(JSON.stringify(DEFAULT_SECTIONS.default));
          sections[slug].cameraId = cameraId;
          return { sculptureConfig: { ...state.sculptureConfig, sections } };
      }),

      updateSectionFX: (slug, slotIndex, updates) => set((state) => {
          const sections = { ...state.sculptureConfig.sections };
          if (!sections[slug]) sections[slug] = JSON.parse(JSON.stringify(DEFAULT_SECTIONS.default));
          const fx = [...sections[slug].fx];
          fx[slotIndex] = { ...fx[slotIndex], ...updates };
          sections[slug].fx = fx;
          return { sculptureConfig: { ...state.sculptureConfig, sections } };
      })
    }),
    {
      name: 'kime-app-storage',
      partialize: (state) => ({ 
        showStudioEditor: state.showStudioEditor,
        sculptureConfig: state.sculptureConfig 
      }),
    }
  )
);

export default useAppStore;
