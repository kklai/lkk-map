import * as THREE from 'three';

import { OrbitControls } from './lib/OrbitControls.js';
import { ParametricGeometry } from './lib/ParametricGeometry.js';
import { updateNav } from './util.js';


let selector = document.querySelector("#canvas");
let width = selector.offsetWidth;
let height = selector.offsetHeight;
let requestId = new Date();
let requestObject = {};

var params = {
  enableWind: true,
  showBall: false
};

var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = 0.1;
var restDistance = 25;
var xSegs = 10;
var ySegs = 9;
var GRAVITY = 981 * 1.4;
var gravity = new THREE.Vector3(0, -GRAVITY, 0).multiplyScalar(MASS);
var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;
var pins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var windForce = new THREE.Vector3(0, 0, 0);
var tmpForce = new THREE.Vector3();
var diff = new THREE.Vector3();

var clothFunction, cloth;

function plane(width, height) {
  return function (u, v, target) {
    var x = (u - 0.5) * width;
    var y = height / 1.5;
    var z = 0;
    target.set(x, y, z);
  };
}

function Particle(x, y, z, mass) {
  this.position = new THREE.Vector3();
  this.previous = new THREE.Vector3();
  this.original = new THREE.Vector3();
  this.a = new THREE.Vector3(0, 0, 0); // acceleration
  this.mass = mass;
  this.invMass = 1 / mass;
  this.tmp = new THREE.Vector3();
  this.tmp2 = new THREE.Vector3();

  clothFunction(x, y, this.position); // position
  clothFunction(x, y, this.previous); // previous
  clothFunction(x, y, this.original);
}

// Force -> Acceleration
Particle.prototype.addForce = function (force) {
  this.a.add(this.tmp2.copy(force).multiplyScalar(this.invMass));
};

// Performs Verlet integration
Particle.prototype.integrate = function (timesq) {
  var newPos = this.tmp.subVectors(this.position, this.previous);
  newPos.multiplyScalar(DRAG).add(this.position);
  newPos.add(this.a.multiplyScalar(timesq));
  this.tmp = this.previous;
  this.previous = this.position;
  this.position = newPos;
  this.a.set(0, 0, 0);
};

function satisfyConstraints(p1, p2, distance) {
  diff.subVectors(p2.position, p1.position);
  var currentDist = diff.length();
  if (currentDist === 0) return; // prevents division by 0
  var correction = diff.multiplyScalar(1 - distance / currentDist);
  var correctionHalf = correction.multiplyScalar(0.5);
  p1.position.add(correctionHalf);
  p2.position.sub(correctionHalf);
}

function Cloth(w, h) {
  w = w || 10;
  h = h || 10;
  this.w = w;
  this.h = h;

  var particles = [];
  var constraints = [];

  var u, v;

  // Create particles
  for (v = 0; v <= h; v++) {
    for (u = 0; u <= w; u++) {
      particles.push(new Particle(u / w, v / h, 0, MASS));
    }
  }

  // Structural
  for (v = 0; v < h; v++) {
    for (u = 0; u < w; u++) {
      constraints.push([
        particles[index(u, v)],
        particles[index(u, v + 1)],
        restDistance
      ]);

      constraints.push([
        particles[index(u, v)],
        particles[index(u + 1, v)],
        restDistance
      ]);
    }
  }

  for (u = w, v = 0; v < h; v++) {
    constraints.push([
      particles[index(u, v)],
      particles[index(u, v + 1)],
      restDistance
    ]);
  }

  for (v = h, u = 0; u < w; u++) {
    constraints.push([
      particles[index(u, v)],
      particles[index(u + 1, v)],
      restDistance
    ]);
  }

  this.particles = particles;
  this.constraints = constraints;

  function index(u, v) {
    return u + v * (w + 1);
  }

  this.index = index;
}

function simulate(now) {
  var windStrength = Math.cos(now / 7000) * 10 + 20;

  windForce.set(
    Math.sin(now / 2000),
    Math.cos(now / 3000),
    Math.sin(now / 1000)
  );
  windForce.normalize();
  windForce.multiplyScalar(windStrength);

  var i, j, il, particles, particle, constraints, constraint;

  // Aerodynamics forces
  if (params.enableWind) {
    var indx;
    var normal = new THREE.Vector3();
    var indices = clothGeometry.index;
    var normals = clothGeometry.attributes.normal;

    particles = cloth.particles;

    for (i = 0, il = indices.count; i < il; i += 3) {
      for (j = 0; j < 3; j++) {
        indx = indices.getX(i + j);
        normal.fromBufferAttribute(normals, indx);
        tmpForce.copy(normal).normalize().multiplyScalar(normal.dot(windForce));
        particles[indx].addForce(tmpForce);
      }
    }
  }

  for (particles = cloth.particles, i = 0, il = particles.length; i < il; i++) {
    particle = particles[i];
    particle.addForce(gravity);
    particle.integrate(TIMESTEP_SQ);
  }

  // Start Constraints

  constraints = cloth.constraints;
  il = constraints.length;

  for (i = 0; i < il; i++) {
    constraint = constraints[i];
    satisfyConstraints(constraint[0], constraint[1], constraint[2]);
  }

  // Pin Constraints

  for (i = 0, il = pins.length; i < il; i++) {
    var xy = pins[i];
    var p = particles[xy];
    p.position.copy(p.original);
    p.previous.copy(p.original);
  }
}

/* testing cloth simulation */

var container;
var camera, scene, renderer;

var clothGeometry;
var object;

let mapbase = "four-trails";

function restart() {
  init();

  if (requestObject[requestId]) {
    window.cancelAnimationFrame(requestObject[requestId]);
    requestId = new Date();  
  }
  
  animate();
}

restart();

// let mapbutton = document.querySelectorAll(".cloth-options .button");
// mapbutton.forEach(function(button){
//   button.addEventListener("click", function(){
//     mapbase = this.getAttribute("data-id");

//     document.querySelectorAll(".cloth-options .button").forEach(function(el){
//       el.classList.remove("active");
//     });

//     document.querySelector(".button[data-id='" + mapbase + "']").classList.add("active");

//     restart();
//   })

// });

document.querySelector(".button-cloth").addEventListener("click", function(){
  updateNav("cloth");
  restart();
})




function init() {

  clothFunction = plane(restDistance * xSegs, restDistance * ySegs);
  cloth = new Cloth(xSegs, ySegs);

  selector.innerHTML = "";
  container = document.createElement("div");
  selector.appendChild(container);

  // scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // camera
  camera = new THREE.PerspectiveCamera( 30, width / height, 1, 5000 );
  camera.position.set(0, 0, innerWidth < 600 ? innerWidth*2.5 : innerHeight*0.8);

  // lights
  scene.add(new THREE.AmbientLight(0x666666));

  var light = new THREE.DirectionalLight(0xffffff, 2.5);
  light.position.set(50, 0, 100);
  light.position.multiplyScalar(1.3);
  scene.add(light);

  // cloth material
  var loader = new THREE.TextureLoader();
  var clothTexture = loader.load("textures/" + mapbase + ".png");
  clothTexture.anisotropy = 16;

  var clothMaterial = new THREE.MeshLambertMaterial({
    map: clothTexture,
    side: THREE.DoubleSide,
    depthTest: false,
    alphaTest: 0.5
  });

  // cloth geometry
  clothGeometry = new ParametricGeometry(
    clothFunction,
    cloth.w,
    cloth.h
  );

  // cloth mesh
  object = new THREE.Mesh(clothGeometry, clothMaterial);
  object.position.set(0, -50, 0);
  object.castShadow = true;
  scene.add(object);

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // controls
  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = true;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minDistance = 250;
  controls.maxDistance = 1000;
  controls.minAzimuthAngle = -THREE.MathUtils.degToRad(20);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(20);
  controls.minPolarAngle = Math.PI / 2 - THREE.MathUtils.degToRad(20);
  controls.maxPolarAngle = Math.PI / 2 + THREE.MathUtils.degToRad(20);

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  width = selector.offsetWidth;
  height = selector.offsetHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestObject[requestId] = requestAnimationFrame(animate);
  simulate(new Date());
  render();
}

function render() {
  var p = cloth.particles;
  for (var i = 0, il = p.length; i < il; i++) {
    var v = p[i].position;
    clothGeometry.attributes.position.setXYZ(i, v.x, v.y, v.z);
  }
  clothGeometry.attributes.position.needsUpdate = true;
  clothGeometry.computeVertexNormals();
  renderer.render(scene, camera);
}