const fs = require('fs');
const path = require('path');
const { GLTFLoader } = require('three-stdlib');
require('jsdom-global')(); 

const loader = new GLTFLoader();
const parseGLB = (file) => {
  const data = fs.readFileSync(file);
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  loader.parse(arrayBuffer, '', (gltf) => {
    let hasSkinned = false;
    let hasBones = false;
    gltf.scene.traverse(c => {
      if (c.isSkinnedMesh) hasSkinned = true;
      if (c.isBone) hasBones = true;
    });
    console.log(`${path.basename(file)} SkinnedMesh: ${hasSkinned}, Bones: ${hasBones}`);
  }, (err) => {
    console.error(`Error parsing ${file}`, err);
  });
};

parseGLB(path.join(__dirname, 'public', 'Kiosk_Centre.glb'));
parseGLB(path.join(__dirname, 'public', 'table-3d.glb'));
