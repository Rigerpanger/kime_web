const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'node_modules/three/examples/jsm/libs/draco/gltf');
const targetDir = path.join(__dirname, 'public/draco');

if (!fs.existsSync(targetDir)){
    fs.mkdirSync(targetDir, { recursive: true });
}

const files = fs.readdirSync(sourceDir);
for (const file of files) {
    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(targetDir, file);
    if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file} to public/draco/`);
    }
}
console.log('Draco setup complete. You can now load without relying on Google CDN.');
