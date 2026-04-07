import * as THREE from 'three';

import { OrbitControls } from './lib/OrbitControls.js';
import { GLTFLoader } from './lib/GLTFLoader.js';

let camera, scene, renderer, paper, controls;
let currentView = "maclehose";
let clock = new THREE.Clock();
let userInteracting = false;

let xpos = {
    "maclehose" : -2,
    "lantau"    : 0,
    "wilson"    : 0,
    "hong-kong" : 0
}

init();

function loadView(view) {
    const loader = new GLTFLoader();
    loader.load( 'textures/' + view + '.gltf', async function ( gltf ) {
        paper = gltf.scene;
        await renderer.compileAsync( paper, camera, scene );

        paper.position.set( xpos[view], 0, 0 );

        const backMaterial = new THREE.MeshStandardMaterial( { color: 0x111111, side: THREE.BackSide } );
        const meshesToAdd = [];
        paper.traverse( function( node ) {
            if ( node.isMesh ) {
                node.material.side = THREE.FrontSide;
                const backMesh = new THREE.Mesh( node.geometry, backMaterial );
                backMesh.matrix = node.matrix;
                backMesh.matrixAutoUpdate = false;
                meshesToAdd.push( { parent: node.parent, mesh: backMesh } );
            }
        } );
        meshesToAdd.forEach( function( item ) { item.parent.add( item.mesh ); } );

        scene.add( paper );

        // fit camera to model at target angle
        const box = new THREE.Box3().setFromObject( paper );
        const sphere = box.getBoundingSphere( new THREE.Sphere() );
        const fov = camera.fov * ( Math.PI / 180 );
        const dist = sphere.radius / Math.sin( fov / 2 );
        const center = sphere.center;
        const polar = 0.95;   // angle from top (0=directly above, PI/2=horizontal)
        const azimuth = 0.4;  // rotation around Y
        camera.position.set(
            center.x + dist * Math.sin( polar ) * Math.sin( azimuth ),
            center.y + dist * Math.cos( polar ),
            center.z + dist * Math.sin( polar ) * Math.cos( azimuth )
        );
        controls.target.copy( center );
        controls.update();
        controls.saveState();

        render();
    } );

}

function init() {

    let selector = document.querySelector( '#paper' );
    let width = selector.offsetWidth;
    let height = selector.offsetHeight;
    const container = document.createElement( 'div' );
    selector.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, width / height, 0.25, 20 );
    camera.position.set( 0, 2, 2 )

    scene = new THREE.Scene();


    loadView(currentView);

    document.querySelectorAll( 'input[name="trail"]' ).forEach( function( radio ) {
        radio.addEventListener( 'change', function() {
            if ( !this.checked ) return;
            if ( paper ) { scene.remove( paper ); paper = null; }
            currentView = this.value;
            userInteracting = false;
            controls.reset();
            loadView( currentView );
        } );
    } );


    // lights
    const lights = {};
    lights.ambient = new THREE.AmbientLight(0xffffff, 2.5, 0);
    scene.add(lights.ambient);

    lights.spot = new THREE.SpotLight(0xffffff, 1, 0);
    lights.spot.position.set(300, 200, 100);
    lights.spot.castShadow = true;
    scene.add(lights.spot);

    lights.point = new THREE.PointLight( 0xffffff, 100, 0 );
    lights.point.position.set( 0, 200, 0 );
    scene.add(lights.point)


    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );
    renderer.setClearColor( 0x111111 );
    container.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener('start', () => { userInteracting = true; });
    controls.addEventListener('change', render );
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.target.set( 0, 0, -0.2 );
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

}


function animate() {
    requestAnimationFrame( animate );
    if (!userInteracting && paper && paper.rotation) {
        const t = clock.getElapsedTime();
        paper.rotation.x = Math.sin( t * 0.3 ) * 0.4;
    }

    render();
}

animate();