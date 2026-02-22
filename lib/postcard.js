import * as THREE from 'three';

import { OrbitControls } from './lib/OrbitControls.js';
import { updateNav } from './util.js';

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


if(window.location.hash == "#postcard") {
    restart();
    updateNav("postcard");
}

document.querySelector(".button-postcard").addEventListener("click", function(){
    window.location.hash = '#postcard';
    restart();
    updateNav("postcard");
})
  

function init() {

    let selector = document.querySelector( '#canvas ' );
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
    plane.rotation.set( 0, 0, 0 );

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
    // controls.enablePan = false; // Disable panning
    controls.minDistance = 40;
    controls.maxDistance = 100;
    // controls.target.set(0, 0, 0); // Center of the scene/object
    controls.addEventListener('change', () => {
        render();
        console.log('Camera position:', camera.position);
        console.log('Controls target:', controls.target);
    });
    

    if (innerWidth < 460) { 
        camera.position.set( -5.398543967517765, -58.58563702287735, 45.82575414676348 );
        controls.target.set( -5.603661168846043, -8.521406094224991, 1.2726318268152443 );
    } else {
        camera.position.set( -9.906928882176489, -39.23878763367577, 27.017418134150976 );
        controls.target.set( -10.256382369922934, -3.433020214525926, -1.7655087700304206 );
    }

    controls.update();

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    let selector = document.querySelector( '#paper' );
    let width = selector.offsetWidth;
    let height = selector.offsetHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );
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

