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

const DEFAULT_SECTIONS = {
  "digital-graphics": {
    camera: { pos: [0, 2, 18], target: [0, 0, 0], zoom: 18, pivotY: 0 },
    fx: [
      { id: '1', type: 'Iris', pos: [0, 0, 0], scale: 1, color: '#ffffff', intensity: 1, active: true },
      { id: '2', type: 'None', active: false }, { id: '3', type: 'None', active: false },
      { id: '4', type: 'None', active: false }, { id: '5', type: 'None', active: false }
    ]
  },
  "gamedev": {
    camera: { pos: [8, 3, 14], target: [0, 0, 0], zoom: 14, pivotY: 0 },
    fx: [
      { id: '1', type: 'TetrisReveal', pos: [0, 0, 0], scale: 1, color: '#ffaa44', intensity: 1, active: true },
      { id: '2', type: 'None', active: false }, { id: '3', type: 'None', active: false },
      { id: '4', type: 'None', active: false }, { id: '5', type: 'None', active: false }
    ]
  },
  "ar-vr": {
    camera: { pos: [-8, 2, 14], target: [0, 0, 0], zoom: 14, pivotY: 0 },
    fx: [
      { id: '1', type: 'ShapeShifter', pos: [0, 4.8, 3.5], scale: 1, color: '#ffaa44', intensity: 1, active: true },
      { id: '2', type: 'None', active: false }, { id: '3', type: 'None', active: false },
      { id: '4', type: 'None', active: false }, { id: '5', type: 'None', active: false }
    ]
  },
  "ai-ml": {
    camera: { pos: [0, 6, 12], target: [0, 4, 0], zoom: 12, pivotY: 4 },
    fx: [
      { id: '1', type: 'NeuralCore', pos: [0, 4.8, 0], scale: 1, color: '#ffaa00', intensity: 1, active: true },
      { id: '2', type: 'None', active: false }, { id: '3', type: 'None', active: false },
      { id: '4', type: 'None', active: false }, { id: '5', type: 'None', active: false }
    ]
  },
  "software-dev": {
    camera: { pos: [5, 1, 15], target: [0, 0, 0], zoom: 15, pivotY: 0 },
    fx: [
      { id: '1', type: 'SoftwareSilhouette', pos: [0, 1.5, 0], scale: 1, color: '#ffaa44', intensity: 1, active: true },
      { id: '2', type: 'None', active: false }, { id: '3', type: 'None', active: false },
      { id: '4', type: 'None', active: false }, { id: '5', type: 'None', active: false }
    ]
  },
  "default": {
    camera: { pos: [0, 0, 16], target: [0, 0, 0], zoom: 16, pivotY: 0 },
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
        sections: DEFAULT_SECTIONS,
        flashFX: { y: 4.8, distance: 1.2, intensity: 40 }
      },
      activeLightId: '1',
      showStudioEditor: false,
      isModalOpen: false,
      isScrollLocked: false,

      setView: (view) => set({ view }),
      setHoveredChunk: (chunkId) => set({ hoveredChunk: chunkId }),
      setActiveSlug: (slug) => set({ activeSlug: slug }),
      
      setSculptureConfig: (newConfig) => set((state) => {
        // Migration & Merge Logic
        const merged = { ...state.sculptureConfig, ...newConfig };
        
        // If sections don't exist in the incoming config (old DB record), migrate old keys
        if (!merged.sections) {
            merged.sections = JSON.parse(JSON.stringify(DEFAULT_SECTIONS));
            if (newConfig.aiFX) merged.sections['ai-ml'].fx[0] = { ...merged.sections['ai-ml'].fx[0], ...newConfig.aiFX };
            if (newConfig.arFX) merged.sections['ar-vr'].fx[0] = { ...merged.sections['ar-vr'].fx[0], ...newConfig.arFX };
            if (newConfig.softwareFX) merged.sections['software-dev'].fx[0] = { ...merged.sections['software-dev'].fx[0], ...newConfig.softwareFX };
            if (newConfig.gamedevFX) merged.sections['gamedev'].fx[0] = { ...merged.sections['gamedev'].fx[0], ...newConfig.gamedevFX };
        }

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

      // NEW: Section-specific updates
      updateSectionCamera: (slug, updates) => set((state) => {
          const sections = { ...state.sculptureConfig.sections };
          if (!sections[slug]) sections[slug] = JSON.parse(JSON.stringify(DEFAULT_SECTIONS.default));
          sections[slug].camera = { ...sections[slug].camera, ...updates };
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
