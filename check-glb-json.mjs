import fs from 'fs';

function readGlbJson(path) {
  const buffer = fs.readFileSync(path);
  
  // Read magic
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546C67) {
    console.error("Not a GLB file");
    return;
  }
  
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);
  
  let offset = 12;
  
  // First chunk should be JSON
  const chunkLength = buffer.readUInt32LE(offset);
  const chunkType = buffer.readUInt32LE(offset + 4);
  
  if (chunkType !== 0x4E4F534A) {
    console.error("First chunk is not JSON");
    return;
  }
  
  offset += 8;
  const jsonBuffer = buffer.slice(offset, offset + chunkLength);
  const jsonString = jsonBuffer.toString('utf-8');
  
  const gltf = JSON.parse(jsonString);
  console.log("Meshes:", gltf.meshes?.length || 0);
  console.log("Materials:", gltf.materials?.length || 0);
  console.log("Nodes:", gltf.nodes?.length || 0);
  
  if (gltf.meshes) {
    console.log("First mesh:", JSON.stringify(gltf.meshes[0]).substring(0, 200));
  }
  if (gltf.materials) {
    console.log("First material:", JSON.stringify(gltf.materials[0]).substring(0, 200));
  }
  
  // Look for translation / scale in nodes
  if (gltf.nodes) {
    console.log("Nodes with transforms:");
    gltf.nodes.forEach((n, i) => {
      if (n.translation || n.scale || n.matrix) {
         console.log(`Node ${i}:`, n);
      }
    });
  }
}

readGlbJson('./public/protest.glb');
