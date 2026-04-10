import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import goldenConfig from './goldenConfig.json';

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

const useAppStore = create(
  persist(
    (set, get) => ({
      view: VIEWS.HOME,
      hoveredChunk: null,
      activeSlug: null,
      sculptureConfig: {
        ...goldenConfig, // Приоритет настроек из Git-файла!
        hdriUrl: null,
        cameras: DEFAULT_CAMERAS,
        flashFX: { y: 4.8, distance: 1.2, intensity: 40 }
      },
      activeLightId: '1',
      activeCameraId: 'cam-main',

      showStudioEditor: false,
      isModalOpen: false,
      isScrollLocked: false,
      isOrbiting: false,
      isOverPanel: false,

      setView: (view) => set({ view }),
      debugInfo: { camera: [0,0,0], config: { y: 0, scale: 0 }, lastError: null },
      setDebug: (info) => set((s) => ({ debugInfo: { ...s.debugInfo, ...info } })),

      setOrbiting: (status) => set({ isOrbiting: status }),
      setIsOverPanel: (val) => set({ isOverPanel: val }),
      setHoveredChunk: (chunkId) => set({ hoveredChunk: chunkId }),
      setActiveSlug: (slug) => {
          set({ activeSlug: slug });
          // При смене слайда подтягиваем конфиг из нашего файла, если он там есть
          const config = get().sculptureConfig;
          if (config.sections?.[slug]) {
              // Авто-фокус на секцию
          }
      },
      
      setSculptureConfig: (newConfig) => set((state) => {
        let merged = { ...state.sculptureConfig, ...newConfig };
        return { sculptureConfig: merged };
      }),

      saveToGoldenFile: async () => {
          try {
              const currentConfig = get().sculptureConfig;
              const toSave = {
                  y: currentConfig.y,
                  scale: currentConfig.scale,
                  rotationY: currentConfig.rotationY,
                  roughness: currentConfig.roughness,
                  metalness: currentConfig.metalness,
                  envMapIntensity: currentConfig.envMapIntensity,
                  emissiveIntensity: currentConfig.emissiveIntensity,
                  bloomIntensity: currentConfig.bloomIntensity,
                  bloomRadius: currentConfig.bloomRadius,
                  mouseLightIntensity: currentConfig.mouseLightIntensity,
                  lights: currentConfig.lights,
                  sections: currentConfig.sections
              };

              const res = await fetch('/api/content/save_to_git', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(toSave)
              });
              const data = await res.json();
              if (data.success) {
                  alert('✅ Сохранено в goldenConfig.json! Сделайте Git Push для обновления сайта.');
              } else {
                  alert('❌ Ошибка: ' + data.error);
              }
          } catch (err) {
              alert('❌ Ошибка сети: ' + err.message);
          }
      },

      pullFromProductionDB: async () => {
          try {
              const res = await fetch('https://kimeproduction.ru/api/content/sculptureConfig');
              if (!res.ok) throw new Error('Could not fetch from production');
              const data = await res.json();
              if (data) {
                  set((state) => ({
                      sculptureConfig: {
                          ...state.sculptureConfig,
                          ...data,
                          // Merge sections properly
                          sections: {
                              ...state.sculptureConfig.sections,
                              ...(data.sections || {})
                          }
                      }
                  }));
                  alert('✅ Настройки успешно импортированы с kimeproduction.ru!');
              }
          } catch (err) {
              alert('❌ Ошибка импорта: ' + err.message);
          }
      },

      nuclearReset: () => set((state) => {
         // Deep reset to goldenConfig.json
         const resetConfig = JSON.parse(JSON.stringify(goldenConfig));
         return {
            sculptureConfig: {
                ...state.sculptureConfig,
                ...resetConfig,
                sections: resetConfig.sections || {}
            },
            // Force reset active section override if any
            activeSlug: 'default' 
         };
      }),

      setShowStudioEditor: (show) => set({ showStudioEditor: show }),
      setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
      setScrollLocked: (isLocked) => set({ isScrollLocked: isLocked }),
      captureTrigger: 0,
      triggerCapture: () => set(state => ({ captureTrigger: state.captureTrigger + 1 })),
      
      setSectionView: (slug, viewData) => set((state) => {
          const activeKey = slug || 'default';
          const sections = JSON.parse(JSON.stringify(state.sculptureConfig.sections || {}));
          if (!sections[activeKey]) sections[activeKey] = { camera: {} };
          
          sections[activeKey].camera = { 
              ...sections[activeKey].camera,
              ...viewData 
          };

          return { sculptureConfig: { ...state.sculptureConfig, sections } };
      }),

      setActiveLightId: (id) => set({ activeLightId: id }),
      addLight: () => set((state) => {
         const newLight = {
            id: `light-${Date.now()}`,
            name: `Light ${ (state.sculptureConfig.lights || []).length + 1 }`,
            intensity: 1.0,
            color: '#ffffff',
            y: 8,
            radius: 10,
            azimuth: 0
         };
         return {
            sculptureConfig: {
               ...state.sculptureConfig,
               lights: [...(state.sculptureConfig.lights || []), newLight]
            },
            activeLightId: newLight.id
         };
      }),
      removeLight: (id) => set((state) => ({
         sculptureConfig: {
            ...state.sculptureConfig,
            lights: (state.sculptureConfig.lights || []).filter(l => l.id !== id)
         }
      })),
      updateLight: (id, updates) => set((state) => ({
         sculptureConfig: {
            ...state.sculptureConfig,
            lights: (state.sculptureConfig.lights || []).map(l => l.id === id ? { ...l, ...updates } : l)
         }
      })),

      setActiveCameraId: (id) => set({ activeCameraId: id }),
      updateCamera: (id, updates) => set((state) => ({
         sculptureConfig: {
            ...state.sculptureConfig,
            cameras: (state.sculptureConfig.cameras || []).map(c => c.id === id ? { ...c, ...updates } : c)
         }
      })),

      updateSectionCamera: (slug, updates) => set((state) => {
          const activeKey = slug || 'default';
          const sections = JSON.parse(JSON.stringify(state.sculptureConfig.sections || {}));
          if (!sections[activeKey]) sections[activeKey] = { camera: {} };
          
          if (updates.modelY !== undefined) sections[activeKey].modelY = updates.modelY;
          if (updates.scale !== undefined) sections[activeKey].scale = updates.scale;
          
          if (updates.azimuth !== undefined || updates.polar !== undefined || updates.radius !== undefined || 
              updates.pivotX !== undefined || updates.pivotY !== undefined || updates.pivotZ !== undefined) {
              sections[activeKey].camera = { ...sections[activeKey].camera, ...updates };
          }
          
          return { sculptureConfig: { ...state.sculptureConfig, sections } };
      }),

      updateSectionFX: (slug, fxId, updates) => set((state) => {
          const activeKey = slug || 'default';
          const sections = JSON.parse(JSON.stringify(state.sculptureConfig.sections || {}));
          if (!sections[activeKey]) return state;
          
          sections[activeKey].fx = (sections[activeKey].fx || []).map(f => 
              f.id === fxId ? { ...f, ...updates } : f
          );
          return { sculptureConfig: { ...state.sculptureConfig, sections } };
      }),

      addSectionFX: (slug, type) => set((state) => {
          const activeKey = slug || 'default';
          const sections = JSON.parse(JSON.stringify(state.sculptureConfig.sections || {}));
          if (!sections[activeKey]) sections[activeKey] = { fx: [] };
          
          const newFX = {
              id: `fx-${Date.now()}`,
              type: type || 'NeuralCore',
              active: true,
              azimuth: 0,
              height: 4.8,
              radius: 4.5,
              scale: 1.0,
              intensity: 1.0,
              color: '#ffffff'
          };
          
          sections[activeKey].fx = [...(sections[activeKey].fx || []), newFX];
          return { sculptureConfig: { ...state.sculptureConfig, sections } };
      }),

      removeSectionFX: (slug, fxId) => set((state) => {
          const activeKey = slug || 'default';
          const sections = JSON.parse(JSON.stringify(state.sculptureConfig.sections || {}));
          if (!sections[activeKey]) return state;
          
          sections[activeKey].fx = (sections[activeKey].fx || []).filter(f => f.id !== fxId);
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
