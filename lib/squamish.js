import { createMapViewer } from './mapviewer.js';
import { GLTFExporter } from './lib/GLTFExporter.js';

const { scene } = createMapViewer({
    sectionId:   'squamish-section',
    canvasId:    'canvas-squamish',
    imageSrc:    'img/squamish100.jpg',
    imageWidth:  1500,
    imageHeight: 2100,
    // planeW/planeH computed automatically from aspect ratio (portrait ~171 x 240)
    cameraDesktop: [-200, 50, 320],
    targetDesktop: [-20, -5, -10],
    cameraMobile:  [-280, 70, 310],
    targetMobile:  [-15, -5, -10],
});

if (new URLSearchParams(window.location.search).has('export')) {
    const btn = document.createElement('button');
    btn.textContent = 'Export GLB';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '9999',
        padding: '10px 20px',
        background: '#fff',
        color: '#111',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '13px',
    });
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
        btn.textContent = 'Exporting…';

        // Force textures to export as JPEG instead of PNG to keep file size down
        scene.traverse((obj) => {
            if (obj.isMesh && obj.material.map) {
                obj.material.map.userData.mimeType = 'image/jpeg';
            }
        });

        const exporter = new GLTFExporter();
        exporter.parse(scene, (glb) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([glb], { type: 'application/octet-stream' }));
            a.download = 'squamish-map.glb';
            a.click();
            btn.textContent = 'Export GLB';
        }, console.error, { binary: true });
    });
}
