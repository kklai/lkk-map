import * as THREE from 'three';

import { OrbitControls } from './lib/OrbitControls.js';
import { updateNav } from './util.js';

let camera, scene, renderer, plane, xrotation = -1.2, dir;
let requestId = new Date();
let requestObject = {};
let t = 0;


function restart() {
    init();
    if (requestObject[requestId]) {
        window.cancelAnimationFrame(requestObject[requestId]);
        requestId = new Date();  
    }
    animate();
}

if(window.location.hash == "#wallmap") {
    restart();
    updateNav("wallmap");
}

document.querySelector(".button-wallmap").addEventListener("click", function(){
    window.location.hash = '#wallmap';
    restart();
    document.querySelector(".lightbox.projects").style.display = "none";
    updateNav("wallmap");
})
  
function init() {

    let selector = document.querySelector( '#canvas' );
    selector.innerHTML = "";
    let width = selector.offsetWidth;
    let height = selector.offsetHeight;
    const container = document.createElement( 'div' );
    selector.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, width / height, 1, 800 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070707);

    // textures
    const textureLoader = new THREE.TextureLoader();
    const map = textureLoader.load( 'img/wallmap.png' );
    map.colorSpace = THREE.SRGBColorSpace;

    // material
    let material = new THREE.MeshStandardMaterial({
        map: map,
    });

    let geometry = new THREE.PlaneGeometry( 258, 179, 1, 1 );
    let frontPlane  = new THREE.Mesh( geometry, material );
    plane = new THREE.Object3D();
    plane.add( frontPlane );
    scene.add( plane );

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
            curveSegments: 10
        });

        // Center it so z=0 is in the middle
        geom.translate(0, 0, -depth/2);
        return geom;
    }

    const ringGeom = makeBeveledFrameRing(258, 179, 1, 3);

    const ringMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1.0,     // higher roughness = wider, softer highlight
        metalness: 0.5
    });

    const ring = new THREE.Mesh(ringGeom, ringMat);
    plane.add(ring);

    // lights
    const lights = {};

    lights.ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(lights.ambient);

    var light = new THREE.DirectionalLight(0xffffff, 2.0);
    light.castShadow = true;
    light.position.set(0, 100, 100);
    scene.add(light);

    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    container.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 50;
    controls.maxDistance = 500;
    controls.target.set( 0, 0, 0 );
    controls.minAzimuthAngle = -Math.PI / 4;  // left/right limit
    controls.maxAzimuthAngle =  Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.update();
    window.addEventListener( 'resize', onWindowResize );

    controls.addEventListener('change', () => {
        render();
        console.log('Camera position:', camera.position);
        console.log('Controls target:', controls.target);
    });

    if (innerWidth < 460) {
        camera.position.set( -352.46335902168045, 72.82883142313287, 246.29146863731253 );
        controls.target.set( -16.17864767023746, -5.794172415039153, -13.255124232328482 );
    } else {
        camera.position.set(-246.81945173936225, 46.49648610000176, 251.30454422845193);
        controls.target.set(-28.442391621975112, -4.189398700025013, -12.878031009802637);
    }
    controls.update();


}

function onWindowResize() {
    let selector = document.querySelector( '#wallmap' );
    let width = selector.offsetWidth;
    let height = selector.offsetHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );
    render();    
}



function render() {
    t += 0.0005;

    // oscillate within safe angles
    plane.rotation.y = Math.sin(t) * 0.6;   // ~ ±34°
    plane.rotation.x = -0.5 + Math.sin(t * 0.7) * 0.15;

    renderer.render(scene, camera);
}

function animate() {
    requestObject[requestId] = requestAnimationFrame( animate );
    render();
}

