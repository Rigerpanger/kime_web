import goldenConfig from './goldenConfig.json';

// ... (rest of VIEWS and DEFAULT_CAMERAS)

const useAppStore = create(
  persist(
    (set, get) => ({
      view: VIEWS.HOME,
      // ... (other states)
      sculptureConfig: {
        ...goldenConfig, // Load initial values from JSON!
        hdriUrl: null,
        cameras: DEFAULT_CAMERAS,
      },
      
      // ... (other actions)

      saveToGoldenFile: async () => {
          try {
              const currentConfig = get().sculptureConfig;
              // We only save sections and main numeric params
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
      
      // ... 

      updateSectionCameraId: (slug, cameraId) => set((state) => {
          const sections = { ...state.sculptureConfig.sections };
          if (!sections[slug]) sections[slug] = JSON.parse(JSON.stringify(DEFAULT_SECTIONS.default));
          sections[slug].cameraId = cameraId;
          return { sculptureConfig: { ...state.sculptureConfig, sections } };
      }),
 
      // NEW DYNAMIC FX SYSTEM
      addSectionFX: (slug, type) => set((state) => {
          const activeKey = slug || 'default';
          const sections = JSON.parse(JSON.stringify(state.sculptureConfig.sections || DEFAULT_SECTIONS));
          if (!sections[activeKey]) sections[activeKey] = JSON.parse(JSON.stringify(DEFAULT_SECTIONS.default));
          
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
          const sections = JSON.parse(JSON.stringify(state.sculptureConfig.sections || DEFAULT_SECTIONS));
          if (!sections[activeKey]) return state;
          
          sections[activeKey].fx = (sections[activeKey].fx || []).filter(f => f.id !== fxId);
          return { sculptureConfig: { ...state.sculptureConfig, sections } };
      }),
 
      updateSectionFX: (slug, fxId, updates) => set((state) => {
          const activeKey = slug || 'default';
          const sections = JSON.parse(JSON.stringify(state.sculptureConfig.sections || DEFAULT_SECTIONS));
          if (!sections[activeKey]) return state;
          
          sections[activeKey].fx = (sections[activeKey].fx || []).map(f => 
              f.id === fxId ? { ...f, ...updates } : f
          );
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
