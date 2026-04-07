import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Custom plugin to automatically securely copy Draco decoder directly from node_modules
function copyDracoPlugin() {
    return {
        name: 'copy-draco',
        buildStart() {
            try {
                const src = path.resolve(__dirname, 'node_modules/three/examples/jsm/libs/draco/gltf');
                const dest = path.resolve(__dirname, 'public/draco');
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, { recursive: true });
                }
                if (fs.existsSync(src)) {
                    fs.readdirSync(src).forEach(file => {
                        fs.copyFileSync(path.join(src, file), path.join(dest, file));
                    });
                    console.log('\n✅ KIME BUILD: Draco binaries successfully injected locally!');
                }
            } catch (err) {
                console.error('\n❌ KIME BUILD: Draco copy failed:', err);
            }
        }
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), copyDracoPlugin()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:3005',
                changeOrigin: true
            }
        }
    }
})
