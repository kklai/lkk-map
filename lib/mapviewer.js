import * as THREE from 'three';
import { OrbitControls } from './lib/OrbitControls.js';

/**
 * Creates a 3D map viewer that renders an image on a rotating framed plane.
 *
 * @param {object} config
 * @param {string}   config.sectionId      - ID of the scroll-snapped section element
 * @param {string}   config.canvasId       - ID of the canvas-inner container element
 * @param {string}   config.imageSrc       - Path to the map image
 * @param {number}   config.imageWidth     - Original image pixel width (used for aspect ratio)
 * @param {number}   config.imageHeight    - Original image pixel height (used for aspect ratio)
 * @param {number}   [config.planeW]       - Override computed plane width
 * @param {number}   [config.planeH]       - Override computed plane height
 * @param {number[]} config.cameraDesktop  - [x, y, z] camera position on desktop
 * @param {number[]} config.targetDesktop  - [x, y, z] orbit controls target on desktop
 * @param {number[]} config.cameraMobile   - [x, y, z] camera position on mobile
 * @param {number[]} config.targetMobile   - [x, y, z] orbit controls target on mobile
 */
export function createMapViewer(config) {
    const {
        sectionId, canvasId, imageSrc,
        imageWidth, imageHeight,
        cameraDesktop, targetDesktop,
        cameraMobile, targetMobile,
    } = config;

    // Compute plane dimensions from image aspect ratio unless overridden.
    // The larger dimension is set to BASE; the other scales proportionally.
    const BASE = 240;
    const aspect = imageWidth / imageHeight;
    const planeW = config.planeW ?? (aspect >= 1 ? BASE         : BASE * aspect);
    const planeH = config.planeH ?? (aspect >= 1 ? BASE / aspect : BASE);

    let camera, scene, renderer, plane;
    let requestId = new Date();
    let requestObject = {};
    let t = 0;
    let isVisible = false;

    new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
    }, { threshold: 0.1 }).observe(document.getElementById(sectionId));

    restart();

    function restart() {
        init();
        if (requestObject[requestId]) {
            window.cancelAnimationFrame(requestObject[requestId]);
            requestId = new Date();
        }
        animate();
    }

    function init() {
        const selector = document.querySelector(`#${canvasId}`);
        selector.innerHTML = '';
        const width = selector.offsetWidth;
        const height = selector.offsetHeight;

        const container = document.createElement('div');
        selector.appendChild(container);

        camera = new THREE.PerspectiveCamera(45, width / height, 1, 800);
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);

        const textureLoader = new THREE.TextureLoader();
        const map = textureLoader.load(imageSrc);
        map.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshStandardMaterial({ map });
        const geometry = new THREE.PlaneGeometry(planeW, planeH, 1, 1);
        const frontPlane = new THREE.Mesh(geometry, material);
        plane = new THREE.Object3D();
        plane.add(frontPlane);
        scene.add(plane);

        const ringGeom = makeBeveledFrameRing(planeW, planeH, 1, 3);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 1.0,
            metalness: 0.5,
        });
        plane.add(new THREE.Mesh(ringGeom, ringMat));

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const light = new THREE.DirectionalLight(0xffffff, 2.0);
        light.castShadow = true;
        light.position.set(0, 100, 100);
        scene.add(light);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 50;
        controls.maxDistance = 500;
        controls.target.set(0, 0, 0);
        controls.minAzimuthAngle = -Math.PI / 4;
        controls.maxAzimuthAngle =  Math.PI / 4;
        controls.maxPolarAngle = Math.PI / 2 - 0.1;
        controls.update();

        window.addEventListener('resize', onWindowResize);

        controls.addEventListener('change', () => {
            render();
            console.log('Camera position:', camera.position);
            console.log('Controls target:', controls.target);
        });

        if (innerWidth < 460) {
            camera.position.set(...cameraMobile);
            controls.target.set(...targetMobile);
        } else {
            camera.position.set(...cameraDesktop);
            controls.target.set(...targetDesktop);
        }
        controls.update();
    }

    function makeBeveledFrameRing(W, H, border, depth) {
        const outer = new THREE.Shape()
            .moveTo(-W/2 - border, -H/2 - border)
            .lineTo( W/2 + border, -H/2 - border)
            .lineTo( W/2 + border,  H/2 + border)
            .lineTo(-W/2 - border,  H/2 + border)
            .lineTo(-W/2 - border, -H/2 - border);

        const hole = new THREE.Path()
            .moveTo(-W/2, -H/2)
            .lineTo( W/2, -H/2)
            .lineTo( W/2,  H/2)
            .lineTo(-W/2,  H/2)
            .lineTo(-W/2, -H/2);

        outer.holes.push(hole);

        const geom = new THREE.ExtrudeGeometry(outer, {
            depth,
            bevelEnabled: true,
            bevelThickness: 2.0,
            bevelSize: 0.5,
            bevelSegments: 10,
            curveSegments: 10,
        });
        geom.translate(0, 0, -depth / 2);
        return geom;
    }

    function onWindowResize() {
        const selector = document.querySelector(`#${canvasId}`);
        const width = selector.offsetWidth;
        const height = selector.offsetHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        render();
    }

    function render() {
        t += 0.0005;
        plane.rotation.y = Math.sin(t) * 0.6;
        plane.rotation.x = -0.5 + Math.sin(t * 0.7) * 0.15;
        renderer.render(scene, camera);
    }

    function animate() {
        requestObject[requestId] = requestAnimationFrame(animate);
        if (!isVisible) return;
        render();
    }
}
