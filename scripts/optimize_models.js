const { Document, NodeIO } = require('@gltf-transform/core');
const { simplify, weld } = require('@gltf-transform/functions');
const { MeshoptSimplifier } = require('meshoptimizer');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '../public');

const MODELS = [
  'pro1.glb',
  'pro3.glb',
  'pro4.glb',
  'Kiosk_Centre.glb'
];

async function optimizeModels() {
  // Initialize Meshopt
  await MeshoptSimplifier.ready;

  const io = new NodeIO();

  for (const filename of MODELS) {
    const inputPath = path.join(PUBLIC_DIR, filename);
    const outputPath = path.join(PUBLIC_DIR, filename.replace('.glb', '_opt.glb'));

    if (!fs.existsSync(inputPath)) {
      console.warn(`[WARN] Skipping ${filename} because it doesn't exist.`);
      continue;
    }

    console.log(`Processing ${filename}...`);
    try {
      const document = await io.read(inputPath);

      // Weld vertices (required before simplify)
      await document.transform(weld({ tolerance: 0.0001 }));

      // Simplify mesh (reduce faces by 50%, allowing up to 1% error)
      await document.transform(
        simplify({
          simplifier: MeshoptSimplifier,
          ratio: 0.5,
          error: 0.01,
        })
      );

      await io.write(outputPath, document);
      console.log(`[SUCCESS] Optimized and saved to ${outputPath}`);
    } catch (e) {
      console.error(`[ERROR] Failed to optimize ${filename}:`, e);
    }
  }
}

optimizeModels().then(() => console.log('Done!')).catch(console.error);
