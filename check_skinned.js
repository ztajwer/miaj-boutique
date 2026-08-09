const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.glb') || f.endsWith('.gltf'));

for (const file of files) {
  const content = fs.readFileSync(path.join(publicDir, file));
  // Just do a string search for "SKIN" or "skin" in the GLB JSON header
  // or "skeleton", "joints"
  const str = content.toString('utf-8', 0, Math.min(content.length, 50000));
  if (str.includes('"skin"') || str.includes('"joints"') || str.includes('"inverseBindMatrices"')) {
    console.log(`${file} contains skinning/joints!`);
  }
}
console.log('Done checking GLBs.');
