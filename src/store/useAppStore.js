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
        aiFX: { y: 4.8, scale: 1.0, orbit: 0 },
        softwareFX: { y: 1.5, scale: 1.0, orbit: 0 },
        arFX: { y: 4.8, scale: 1.0, distance: 3.5, orbit: 0 },
        gamedevFX: { y: 0, scale: 1.0 },
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
        const merged = { ...state.sculptureConfig, ...newConfig };
        // Ensure FX sub-objects exist to prevent crashes in Studio or Shaders
        const ensureFX = (obj) => ({
          y: obj?.y ?? 0,
          scale: obj?.scale ?? 1.0,
          orbit: obj?.orbit ?? 0,
          ...obj
        });
        
        return {
          sculptureConfig: {
            ...merged,
            aiFX: ensureFX(merged.aiFX),
            softwareFX: ensureFX(merged.softwareFX),
            arFX: { ...ensureFX(merged.arFX), distance: merged.arFX?.distance ?? 3.5 },
            gamedevFX: { y: merged.gamedevFX?.y ?? 0, scale: merged.gamedevFX?.scale ?? 1.0 },
            flashFX: { 
              y: merged.flashFX?.y ?? 4.8, 
              distance: merged.flashFX?.distance ?? 1.2, 
              intensity: merged.flashFX?.intensity ?? 40 
            }
          }
        };
      }),
      setShowStudioEditor: (show) => set({ showStudioEditor: show }),
      setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
      setScrollLocked: (isLocked) => set({ isScrollLocked: isLocked }),
      
      // Dynamic Light Controls
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
