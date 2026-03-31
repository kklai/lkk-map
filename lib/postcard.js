import * as THREE from 'three';

import { OrbitControls } from './lib/OrbitControls.js';

let camera, scene, renderer, plane, xrotation = -1.2, dir;
let requestId = new Date();
let requestObject = {};


function restart() {
    init();
    if (requestObject[requestId]) {
        window.cancelAnimationFrame(requestObject[requestId]);
        requestId = new Date();  
    }
    animate();
}


restart();

function init() {

    let selector = document.querySelector( '#canvas-postcard' );
    selector.innerHTML = "";
    let width = selector.offsetWidth;
    let height = selector.offsetHeight;
    const container = document.createElement( 'div' );
    selector.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, width / height, 1, 500 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // const axesHelper = new THREE.AxesHelper( 5 );
    // scene.add( axesHelper );

    // textures
    const textureLoader = new THREE.TextureLoader();
    const map = textureLoader.load( 'img/postcard.png' );
    map.encoding = THREE.sRGBEncoding;

    const displacementMap = textureLoader.load( 'img/postcard-displacement.png' );

    // material
    let material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        displacementMap: displacementMap,
        displacementScale: 2.5,
        side: THREE.DoubleSide,
        map: map
    });


    let geometry = new THREE.PlaneGeometry( 60, 40, 50, 50 );
    let frontPlane  = new THREE.Mesh( geometry, material );
    frontPlane.castShadow = true;

    let geometry2 = new THREE.PlaneGeometry( 60, 40, 50, 50 );
    geometry2.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI));
    var textureBack = textureLoader.load( 'img/postcardback.png' );
    let material2 = new THREE.MeshLambertMaterial({ color: 0x111111, map: textureBack,  color: 0xffffff });
    let backPlane = new THREE.Mesh( geometry2, material2 );

    plane = new THREE.Object3D();
    plane.add( frontPlane );
    plane.add( backPlane );
    scene.add( plane );

    plane.position.set( 0, 0, 0 );
    plane.rotation.set( 0.4, 0.6, 0.1 );

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 1)); // low ambient to keep blacks
    
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(30, 40, 60);
    key.castShadow = true;
    scene.add(key);


    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    container.appendChild( renderer.domElement );

    map.colorSpace = THREE.SRGBColorSpace;
    displacementMap.colorSpace = THREE.NoColorSpace;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // map.flipY = false;
    // displacementMap.flipY = false;
    // map.needsUpdate = true;
    // displacementMap.needsUpdate = true;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.minDistance = 40;
    controls.maxDistance = 300;
    // controls.target.set(0, 0, 0); // Center of the scene/object
    controls.addEventListener('change', () => {
        render();
        console.log('Camera position:', camera.position);
        console.log('Controls target:', controls.target);
    });
    

    camera.position.set( 0, 0, postcardZ(width, height) );
    controls.target.set( 0, 0, 0 );
    controls.update();

    window.addEventListener( 'resize', onWindowResize );

}

function postcardZ(width, height) {
    const vFov = camera.fov * Math.PI / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (width / height));
    const halfTanH = Math.tan(hFov / 2);
    const targetPx = width < 460 ? width * 1.2 : Math.min(600, width);
    // map 60 world units to targetPx pixels: z = 30 * width / (targetPx * halfTanH)
    return 30 * width / (targetPx * halfTanH);
}

function onWindowResize() {

    let selector = document.querySelector( '#canvas-postcard' );
    let width = selector.offsetWidth;
    let height = selector.offsetHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );

    camera.position.set( 0, 0, postcardZ(width, height) );
    controls.target.set( 0, 0, 0 );
    controls.update();

    render();
}

function render() {
    renderer.render( scene, camera );
    // if (xrotation == -1.5) {
    //     dir = "fwd";
    //     xrotation = plane.rotation.x;
    // } else if (xrotation == -1.1) {
    //     dir = "bwd";
    // }

    // if (dir == "fwd") {
    //     plane.rotation.x += 0.001
    //     plane.rotation.y -= 0.001
    // } else {
    //     plane.rotation.x -= 0.001
    //     plane.rotation.y += 0.001
    // }

    // xrotation = plane.rotation.x.toFixed(1);
    
    plane.rotation.x += 0.0005;
    plane.rotation.y += 0.0005;
}

function animate() {
    requestObject[requestId] = requestAnimationFrame( animate );
    render();
}

