const fs = require('fs');

function inspectGLB(filePath) {
  const buffer = fs.readFileSync(filePath);
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    console.log("Not a valid GLB file.");
    return;
  }
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);
  const jsonChunkLength = buffer.readUInt32LE(12);
  const jsonChunkType = buffer.readUInt32LE(16);
  if (jsonChunkType !== 0x4E4F534A) {
    console.log("First chunk is not JSON.");
    return;
  }
  const jsonString = buffer.toString('utf8', 20, 20 + jsonChunkLength);
  const gltf = JSON.parse(jsonString);
  console.log("Meshes:", gltf.meshes ? gltf.meshes.length : 0);
  console.log("Nodes:", gltf.nodes ? gltf.nodes.map(n => n.name).join(', ') : 'none');
  
  if (gltf.materials) {
    console.log("Materials:", gltf.materials.map(m => m.name || 'unnamed').join(', '));
  }
}

inspectGLB('./public/try.glb');
