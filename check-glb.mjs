import { NodeIO } from '@gltf-transform/core';
import { bounds } from '@gltf-transform/functions';
import { draco } from '@gltf-transform/functions';

async function main() {
  try {
    const io = new NodeIO();
    // Register Draco and Meshopt decoders if needed, but for bounds we might not need it if we just look at nodes
    const doc = await io.read('./public/protest.glb');
    
    let meshCount = 0;
    doc.getRoot().listMeshes().forEach((m) => {
      meshCount++;
    });
    
    console.log(`Found ${meshCount} meshes.`);
    
    const scene = doc.getRoot().getDefaultScene();
    if (scene) {
      const b = bounds(scene);
      console.log('Scene Bounds:', b);
      
      const sizeX = b.max[0] - b.min[0];
      const sizeY = b.max[1] - b.min[1];
      const sizeZ = b.max[2] - b.min[2];
      
      console.log(`Size: X=${sizeX}, Y=${sizeY}, Z=${sizeZ}`);
      console.log(`Max Dim: ${Math.max(sizeX, sizeY, sizeZ)}`);
    } else {
      console.log('No default scene found!');
    }
  } catch (e) {
    console.error(e);
  }
}

main();
