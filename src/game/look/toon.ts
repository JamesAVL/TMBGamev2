import * as THREE from 'three';

// The handmade look: shared toon ramp + procedural paper grain. Generated at
// runtime — no texture assets, no licences.

let gradientMap: THREE.DataTexture | null = null;
export function getGradientMap(): THREE.DataTexture {
  if (!gradientMap) {
    // 3-step ramp: shadow, mid, light
    const data = new Uint8Array([90, 90, 90, 255, 180, 180, 180, 255, 255, 255, 255, 255]);
    gradientMap = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
}

let paperTexture: THREE.CanvasTexture | null = null;
export function getPaperTexture(): THREE.CanvasTexture {
  if (!paperTexture) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const g = canvas.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, size, size);
    // fibrous flecks — like cheap sugar paper
    for (let i = 0; i < 2600; i++) {
      const shade = 235 + Math.floor(Math.random() * 20);
      g.fillStyle = `rgb(${shade},${shade - 2},${shade - 5})`;
      const w = 1 + Math.random() * 2.5;
      g.fillRect(Math.random() * size, Math.random() * size, w, w * (0.4 + Math.random()));
    }
    // a few longer fibres
    g.strokeStyle = 'rgba(205,200,190,0.5)';
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const a = Math.random() * Math.PI;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7);
      g.stroke();
    }
    paperTexture = new THREE.CanvasTexture(canvas);
    paperTexture.wrapS = THREE.RepeatWrapping;
    paperTexture.wrapT = THREE.RepeatWrapping;
    paperTexture.repeat.set(6, 6);
  }
  return paperTexture;
}

export const OUTLINE_COLOR = '#181018';
export const OUTLINE_THICKNESS = 0.02;
