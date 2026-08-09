const fs = require('fs');
const path = require('path');
const THREE = require('three');
const { GLTFLoader } = require('three-stdlib');
require('jsdom-global')(); // Need DOM for GLTFLoader

const loader = new GLTFLoader();
const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.glb'));

const parseGLB = (file) => {
  const data = fs.readFileSync(path.join(publicDir, file));
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  loader.parse(arrayBuffer, '', (gltf) => {
    let hasSkinned = false;
    gltf.scene.traverse(c => {
      if (c.isSkinnedMesh) {
        hasSkinned = true;
      }
    });
    if (hasSkinned) console.log(`${file} HAS SKINNED MESH`);
  }, (err) => {
    console.error(`Error parsing ${file}: ${err.message}`);
  });
};

files.forEach(parseGLB);
