let pagestate = "en";

const addQueryParam = (key, value) => {
	const url = new URL(window.location.href);
	url.searchParams.set(key, value);
	window.history.pushState({}, '', url.toString());
};

function switchTo(lang) {
	let alltexts = document.querySelectorAll(".g-version");
	for (let i = 0; i < alltexts.length; i++) {
		alltexts[i].classList.remove("g-show");
	}
	let versiontexts = document.querySelectorAll("." + lang);
	for (let i = 0; i < versiontexts.length; i++) {
		versiontexts[i].classList.add("g-show");
	}
    pagestate = lang;
    addQueryParam("v", lang)
}

const urlParams = new URLSearchParams(window.location.search);
const lang = urlParams.get('v');

if (lang && lang != pagestate) {
    switchTo(lang);
}

document.querySelector(".g-read.g-cn").addEventListener("click", function(){
    switchTo("cn")
})

document.querySelector(".g-read.g-en").addEventListener("click", function(){
    switchTo("en")
})

import * as THREE from './three-155-min.js';
import { OrbitControls } from './orbit-controls.js';

export const mainScript = {
	_init: function (_props, _data, cameraPosData, labels) {
		// settings
		let assetHeight = document.querySelector(".g-asset-scroll-annotations").offsetHeight,
		isMobile = window.innerWidth < 460,
		scrollPct = 0, 
		containerCanvas = null, 
		labelscont = document.querySelector('.g-3d-labels-cont'), 
		container = document.querySelector('.g-asset-container'), 
		scrollStart = 0.0, 
		scrollEnd = 1.0, 
		frameLength = 850, 
		debug = false, 
		scene = null, 
		camera = null, 
		renderer = null, 
		now = null, 
		controls = null, 
		then = Date.now(), 
		fpsInterval = 1000 / 60, 
		scrollPctAdj = 0, 
		drawPctAdj = 0,
		lerpDivider = 12, 
		frameCurr = 0, 
		frameSegIndex = 0, 
		useOrbit = window.location.href.indexOf('orbit') > -1, 
		throttleResize = false,
		addAxes = false,
		myreq = null,
		worldWidth = 2500,
		worldDepth = 1400,
		options = { backgroundColor: 0x000000 },
		groundGroup = null;

		let mapFade = 0;
		let mapFadeTarget = 0;
		let mapFadeSpeed = 0.08; // higher = faster fade per frame

		let currentMapbaseSrc = null;

		// Load camera positions from JSON file
		let desktopCameraPos = [];
		let desktopcameraAimPos = [];
		let mobileCameraPos = [];
		let mobileCameraAimPos = [];

		let sections = ["intro", "section-1", "section-2", "section-3", "section-4"];
		let frames = [];
		sections.forEach(function(d,di){
			let cont = document.querySelector('[data-id="' + d + '"]');
			let contTop = cont.offsetTop;
			let pct = contTop / (assetHeight - window.innerHeight);
			let frame = Math.round(pct * frameLength);
			frames.push(frame);

			if (di == sections.length - 1) {
				let pct = (assetHeight - window.innerHeight) / assetHeight;
				let frame = Math.round(pct * frameLength);
				frames.push(frame);
			}
		})
				
		let whatwhereDesktop = [
			{ totalFrames: 2300, sections: "path",  frames: [-1, frames[1]] },
			{ totalFrames: 1060,  sections: "path-hk", frames: [frames[1], frames[2]] },
			{ totalFrames: 1871,  sections: "path-wilson",	frames: [frames[2],  frames[3]] },
			{ totalFrames: 921,  sections: "path-lantau", frames: [frames[3],  frames[4]] },
			{ totalFrames: 1500,  sections: "path-maclehose", frames: [frames[4],  frames[5]] },
			{ totalFrames: 2300,  sections: "path", 	frames: [frames[5],  frameLength] },
		]

		let whatwhereMobile = whatwhereDesktop;

		let whatwhere = isMobile ? whatwhereMobile : whatwhereDesktop;

		const mapbaseTimeline = [
			{ frames: [-1, (frames[1]-10)],  src: isMobile ? 'map-mobile.png' : 'map.png' },
			{ frames: [(frames[1]-10), frames[4]], src: isMobile ? 'map-zoomed-mobile.png' : 'map-zoomed.png' },
			{ frames: [frames[4], frameLength], src: isMobile ? 'map-mobile.png' : 'map.png' },
		];

		let cameraDataNames = ["desktopCameraPos", "desktopcameraAimPos", "mobileCameraPos", "mobileCameraAimPos"];
		let cameraData = {
			desktopCameraPos: cameraPosData.desktop.map(d => d.camera) || [],
			desktopcameraAimPos: cameraPosData.desktop.map(d => d.target) || [],
			mobileCameraPos: cameraPosData.mobile.map(d => d.camera) || [],
			mobileCameraAimPos: cameraPosData.mobile.map(d => d.target) || []
		};

		cameraDataNames.forEach(function(name){
			cameraData[name] = cameraData[name].map((pos, index) => ({
				pos: {...pos},
				id: index,
				frame: frames[index],
				ease: "easeInOut"
			}));
			
			// Duplicate each item in the array
			const duplicated = [];
			const frameEquivalentToWindowHeight = (window.innerHeight*1.5 / (assetHeight - window.innerHeight)) * frameLength;
			cameraData[name].forEach((item, index) => {
				duplicated.push(item);

				if (index > 0) {
					const nextFrame = index < cameraData[name].length - 1 ? cameraData[name][index + 1].frame : item.frame;
					duplicated.push({...item, pos: {...item.pos}, frame: nextFrame - frameEquivalentToWindowHeight});
				}
			});
			cameraData[name] = duplicated;
		})

		let cameraPos = window.innerWidth > 600 ? cameraData.desktopCameraPos : cameraData.mobileCameraPos;
		let cameraAimPos = window.innerWidth > 600 ? cameraData.desktopcameraAimPos : cameraData.mobileCameraAimPos;

		let labels_cn = {
			"TUEN\rMUN": "屯門",
			"TAI MO SHAN\r957": "大帽山\r957",
			"LION ROCK\r495": "獅子山\r495",
			"SAI\rKUNG": "西貢",
			"MA ON SHAN\r702": "馬鞍山\r702",
			"FAN LAU": "分流",
			"TAI O": "大澳",
			"LANTAU\rPEAK\r934": "鳳凰山\r934",
			"SUNSET\rPEAK\r869": "大東山\r869",
			"MUI WO": "梅窩",
			"LANTAU\rISLAND": "大嶼山",
			"SHA TIN\rPASS": "沙田坳",
			"TATE’S CAIRN\r577": "大老山\r577",
			"JARDINE’S\rLOOKOUT\r433 M": "渣甸山\r433 M",
			"SHA TIN": "沙田",
			"KOWLOON": "九龍",
			"HONG KONG\rISLAND": "",
			"PAT SIN\rLENG": "八仙嶺",
			"CLOUDY HILL\r440": "九龍坑山\r440",
			"SHING MUN\rRESERVOIR": "城門水塘",
			"BLACK HILL\r304": "五桂山\r304",
			"DEVIL’S PEAK\r222": "魔鬼山\r222",
			"VIOLET HILL\r435": "紫羅蘭山\r435",
			"THE TWINS": "孖岡山",
			"NAM CHUNG": "南涌",
			"TAI PO": "大埔",
			"LAM TIN": "藍田",
			"TAI KOO": "太古",
			"STANLEY": "赤柱",
			"TAI TAM\rRESERVOIR": "大潭水塘",
			"THE\rPEAK": "山頂",
			"MOUNT\rBUTLER\r435": "畢拿山\r435",
			"JARDINE’S\rLOOKOUT\r433": "渣甸山\r433",
			"DRAGON’S\rBACK": "龍脊",
			"BIG WAVE\rBAY": "大浪灣",
			"ABERDEEN": "香港仔",
			"HONG KONG TRAIL\r50 KM": "港島徑\r50 KM",
			"LANTAU TRAIL\r70 KM": "鳳凰徑\r70 KM",
			"MACLEHOSE TRAIL\r100 KM": "麥理浩徑\r100 KM",
			"WILSON TRAIL\r78 KM": "衛奕信徑\r78 KM"
		}

		labels.forEach(function(d){
			let frameIndex = sections.indexOf(d.name);
			let frameStart = frameIndex == 0 ? -1 : frames[frameIndex];
			let frameEnd = frames[frameIndex+1];
			d.frames = [[frameStart, frameEnd]];

			if (d.text && labels_cn[d.text]) {
				d.text_cn = labels_cn[d.text];
			} else if (d.text) {
				console.log(d.text + " not found in labels_cn")
			}

			if (frameIndex == 0) {
				d.frames.push([frames[frames.length - 1], frameLength])
			}

		})

		if (isMobile) {
			let textConts = document.querySelectorAll('.g-text-cont');
			for (var i = 0; i < textConts.length; i++) {
				let el = textConts[i];
				let mobileFrame = el.getAttribute("data-mobile-frame");
				if (mobileFrame) {
					el.style.top = mobileFrame/850*100 + "%";
				}
			}
		}

		const trail = {};

		labelscont.innerHTML = '';

		const addDebugElems = () => {
			for (let i = 0; i < 1.005; i += 0.005) {
				let debugTick = document.createElement('div'), tickRange = scrollEnd - scrollStart, tickPct = (i - scrollStart) / tickRange, viewHeight = window.innerHeight, halfHeight = viewHeight / 2;

				debugTick.className = 'g-asset-debug-pct';
				debugTick.style.top = halfHeight + (assetHeight - viewHeight) * i + 'px';

				if (i < scrollStart || i - 0.005 > scrollEnd) {
					let percent = i < scrollStart ? 0 : frameLength;
					debugTick.innerHTML = percent.toFixed(1) + '&nbsp;';
					debugTick.classList.add('g-asset-debug-pct-soft');
				} else {
					debugTick.innerHTML = (tickPct * frameLength).toFixed(1) + '&nbsp;';
				}
				container.appendChild(debugTick);
			}
		};

		const valueTween = (sPos, ePos, time, dur, ease) => {
			let change = ePos - sPos, locTime = time;

			if (!dur || dur === 1 || time === dur) return ePos;

			switch (ease) {
				case 'linear':
					return sPos + change * (time / dur);
				case 'easeIn':
					return change * (locTime /= dur) * locTime * locTime + sPos;
				case 'easeOut':
					return change * ((locTime = time / dur - 1) * locTime * locTime + 1) + sPos;
				case 'easeInOut':
					if ((locTime /= dur / 2) < 1) return (change / 2) * locTime * locTime * locTime + sPos;
					return (change / 2) * ((locTime -= 2) * locTime * locTime + 2) + sPos;
				default:
					return sPos + change * (time / dur);
			}
		};

		const onPageScroll = () => {
			const scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;

			let assetHeight = container.offsetHeight, containerTop = container.offsetTop, containerBottom = containerTop + container.offsetHeight, containerStart = containerTop, containerEnd = containerBottom - containerCanvas.offsetHeight;

			let startStopLength = scrollStart + (1 - scrollEnd), startHeight = assetHeight * scrollStart, startStopHeight = assetHeight * startStopLength;

			scrollPct =
				(scrollTop - containerStart - startHeight) /
				(containerEnd - containerStart - startStopHeight);
			scrollPct = scrollPct < 0 ? 0 : scrollPct > 1 ? 1 : scrollPct;

			// console.log(scrollPct)
		};

		let ogwidth = window.innerWidth;
		const onWindowResize = () => {
			if (!throttleResize) {

				if (ogwidth !== window.innerWidth) {
					const width = window.innerWidth;
					const height = window.innerHeight;
					ogwidth = width;

					renderer.setSize(width, height);
					camera.aspect = width / height;
					camera.updateProjectionMatrix();

					setTimeout(function () {
						throttleResize = false;
					}, 150);
				}
			}
		};

		const setupScene = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			scene = new THREE.Scene();
			camera = new THREE.PerspectiveCamera(35, width / height, 1e-6, 1e27);

			if (addAxes) {
				const axesHelper = new THREE.AxesHelper(50000);
				scene.add(axesHelper);
			}

			camera.position.x = cameraPos[0].pos.x;
			camera.position.y = cameraPos[0].pos.y;
			camera.position.z = cameraPos[0].pos.z;

			renderer = new THREE.WebGLRenderer({
				logarithmicDepthBuffer: true,
				antialias: true,
				alpha: true
			});
			renderer.shadowMap.enabled = true;
			renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.setClearColor(new THREE.Color(options.backgroundColor));
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setSize(window.innerWidth, window.innerHeight);
			containerCanvas = renderer.domElement;
			container.appendChild(containerCanvas);

			if (useOrbit) {
				controls = new OrbitControls(camera, containerCanvas);
				controls.panSpeed = 20.0;
				// controls.enablePan = false;
				controls.addEventListener('change', () => console.log(controls.object.position, controls.target));
				document.querySelector('.g-body').style.display = 'none';
				document.querySelector('.map').classList.add("orbit");

				camera.position.set(0, 1500, 2500);
				controls.target.set(0, 0, 0);
				controls.update();
			}

		};

		const setupLights = () => {
			const ambient = new THREE.AmbientLight(0xffffff, 2, 0);
			scene.add(ambient);

			var light = new THREE.DirectionalLight(0xffffff, 2);
			light.position.set(0, 100, 100);
			scene.add(light);
		};

		const texLoader = new THREE.TextureLoader();
		const texCache = new Map();

		function loadTexCached(src, { colorSpace } = {}) {
			// if (texCache.has(src)) return texCache.get(src);

			const t = texLoader.load(src);
			if (colorSpace) t.colorSpace = colorSpace;
			texCache.set(src, t);
			return t;
		}

		function setBaseMapNext(src) {
			const tex = loadTexCached(src, { colorSpace: THREE.SRGBColorSpace });
			tex.needsUpdate = true;

			// put new texture into B, start fade from A -> B
			trail.material.uniforms.uMixImageB.value = tex;
			trail.material.uniforms.uMapFade.value = 0.0;

			mapFade = 0;
			mapFadeTarget = 1;

			currentMapbaseSrc = src;
		}

		const loadTexture = (feature) => {
			const positionLoader = new THREE.TextureLoader();
			let imguse = "path.png";
			positionLoader.load(imguse, function (texture) {
				texture.minFilter = THREE.NearestFilter;
				texture.magFilter = THREE.NearestFilter;
				feature.material.uniforms.uImageWritingPosition.value = texture;
				feature.material.uniforms.uFrames.value = whatwhere[0].totalFrames;
				// feature.material.uniforms.uImageWritingColor.value = inkBlack;
			});

			// const displacementLoader = new THREE.TextureLoader();
			// displacementLoader.load("dem.jpg", function (texture) {
			// 	feature.material.uniforms.uDisplacementMap.value = texture;
			// 	feature.material.uniforms.uDisplacementStrength.value = 0.0;
			// });

			const mapbaseLoader = new THREE.TextureLoader();
			let mapbaseuse = isMobile ? "map-mobile.png" : "map.png";
			mapbaseLoader.load(mapbaseuse, function (texture) {
				feature.material.uniforms.uMixImage.value = texture;
				feature.material.uniforms.uMixStrength.value = 0.5;
			});

			const initial = loadTexCached(mapbaseuse, { colorSpace: THREE.SRGBColorSpace });
			trail.material.uniforms.uMixImageA.value = initial;
			trail.material.uniforms.uMixImageB.value = initial;
			trail.material.uniforms.uMapFade.value = 0.0;
			currentMapbaseSrc = mapbaseuse;

			const inkLoader = new THREE.TextureLoader();
			inkLoader.load("ink-white.png", function (texture) {
				feature.material.uniforms.uImageWritingColor.value = texture;
			});

		};


		const addPath = () => {
			const group = new THREE.Group();
			const material = shaderShapes(trail);
			const geo = new THREE.PlaneGeometry(worldWidth, worldDepth, 100, 100);
			geo.computeVertexNormals();
			const mesh = new THREE.Mesh(geo, material);
			mesh.position.set(0, 0, 0);
			mesh.rotation.x = -Math.PI / 2;
			mesh.castShadow = true;
			material.transparent = true;
			trail.material = material;
			loadTexture(trail);
			group.add(mesh);
			scene.add(group);
		};

		const shaderShapes = () => {
			var material = new THREE.ShaderMaterial({
				uniforms: {
					uDisplacementMap: {
						value: null, // Displacement map texture
						type: "t"
					},
					uDisplacementStrength: {
						value: 100.0, // Strength of the displacement
					},
					uMixImage: {
						value: null, // Texture for the new image
						type: "t"
					},
					uMixStrength: {
						value: 0.0
					},
					uMixImageA: { value: null, type: "t" },
					uMixImageB: { value: null, type: "t" },
					uMapFade:   { value: 0.0 }, // 0 = A, 1 = B
					bboxMin: {
						value: [0.0, 0.0, 0.0]
					},
					bboxMax: {
						value: [worldWidth, worldDepth, 1.0]
					},
					uSection: {
						value: 0.0
					},
					uHasWritten: {
						value: 0.0
					},
					uImageWritingPosition: {
						value: null,
						type: "t"
					},
					uImageWritingColor: {
						value: null,
						type: "t"
					},
					uFrames: {
						value: 1.0,
					},
					uDrawPct: {
						value: 0.0
					},
					uDrawPctAdj: {
						value: 0.0
					},
					uDistance: {
						value: 1000
					},
					uIsClear: {
						value: 0.0
					}
				},
				vertexShader: `
				uniform vec3 bboxMin;
				uniform vec3 bboxMax;
				uniform sampler2D uDisplacementMap;
				uniform float uDisplacementStrength;
				uniform sampler2D uMixImage;
			  	uniform float uMixStrength; 

				varying vec2 vUv;
				varying vec2 vTexCoord;
			
				void main() {
					vUv = uv;
					vTexCoord = uv;
					// vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);
					// vUv.x = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x);

					float displacement = texture2D(uDisplacementMap, vUv).r; // Using red channel for displacement
					vec3 normalizedNormal = normalize(normal);
					vec3 displacedPosition = position + normal * displacement * uDisplacementStrength;


					gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition,1.0);
					
			  }
			`,
				fragmentShader: `
			  uniform vec3 color1;
			  uniform vec3 color2;
			  uniform sampler2D uDisplacementMap;
			  uniform sampler2D uImageWritingPosition;
			  uniform sampler2D uImageWritingColor;
			  uniform sampler2D uMixImage;
			  uniform float uMixStrength; 
			  uniform float uDrawPct;
			  uniform float uDrawPctAdj;
			  uniform vec2 uTexCoord;
			  uniform float uFrames;
			  uniform float uDistance;
			  uniform float uIsClear;
			  uniform sampler2D uMixImageA;
			  uniform sampler2D uMixImageB;
			  uniform float uMapFade;
		
			  varying vec2 vTexCoord;
			
			  varying vec2 vUv;
			  
			  void main() {

			    vec4 baseA = texture2D(uMixImageA, vTexCoord);
				vec4 baseB = texture2D(uMixImageB, vTexCoord);
				
			  
			  	// Sample the existing textures
				vec4 tex2D = texture2D (uImageWritingPosition, vTexCoord);
				vec4 color2D = texture2D (uImageWritingColor, vTexCoord);

			  	// Existing color logic
				vec3 blended = vec3(color2D.r, color2D.g, color2D.b); 
				vec4 textColor = vec4 (blended, tex2D.b);

				// Calculate pixel percentage
				float red = tex2D.r;
				float green = tex2D.g;
				float pixelPct = ((red * 255.0) + (green * 65280.0)) / uFrames;
			  
			  	// Existing output color
				vec4 outColor = red + green > 0.0 && uDrawPct > pixelPct ? textColor :  vec4(255.0, 255.0, 255.0, 0.0);

				// Sample the new image
				//vec4 mixImageColor = texture2D(uMixImage, vTexCoord);
				vec4 mixImageColor = mix(baseA, baseB, clamp(uMapFade, 0.0, 1.0));

				// Extract alpha channels
				float foregroundAlpha = outColor.a;   // Alpha of outColor (foreground)

				// Perform alpha compositing
				vec3 finalRGB = mixImageColor.rgb * (1.0 - foregroundAlpha) + outColor.rgb * foregroundAlpha;
				float finalAlpha = max(mixImageColor.a, foregroundAlpha); // Keep max alpha for visibility

				float displacement = texture2D(uDisplacementMap, vTexCoord).r;
				finalRGB += displacement * 0.1;

				// Set the final color
				gl_FragColor = vec4(finalRGB, finalAlpha);

			  }
			`,
				wireframe: false,
				side: THREE.FrontSide
			});

			return material;
		};

		const sluggify = (x) => {
			return x
				.toLowerCase()
				.split(' ')
				.join('-')
				.replace(/[.,\/#!$%\^&\*;:{}=\_`~()]/g, '');
		};

		const getScreenPos = (x, y, z) => {
			var p = new THREE.Vector3(x, y, z);
			var vector = p.project(camera);
			vector.x = ((vector.x + 1) / 2) * containerCanvas.offsetWidth;
			vector.y = (-(vector.y - 1) / 2) * containerCanvas.offsetHeight;
			return vector;
		};

		function componentToHex(c) {
			var hex = c.toString(16);
			return hex.length == 1 ? '0' + hex : hex;
		}

		function rgbToHex(r, g, b) {
			return componentToHex(r) + componentToHex(g) + componentToHex(b);
		}

		const addLabels = () => {
			labels.forEach(function (d,i) {
				let id = "text-" + i;

				let textEl = document.createElement('div');
				textEl.classList.add('g-3d-label');
				textEl.classList.add(id);

				let classnamesadd = d.classname.split(" ");
				classnamesadd.forEach(function(cn){
					if (cn) {
						textEl.classList.add(cn);
					}
				})

				if (d.type) {
					textEl.classList.add(d.type);
				}
				
				if (d.align) {
					textEl.classList.add(d.align);
				}

				let innerEl = document.createElement('div');
				innerEl.classList.add('g-inner');

				let span_en = document.createElement('div');
				span_en.classList.add('en');
				span_en.classList.add('g-version');

				if (lang == "en" || !lang) {
					span_en.classList.add('g-show');
				}

				if (d.color != "rgb(0,0,0)") {
					textEl.style.color = d.color;
				}

				let hasnumber = /\d/.test(d.text) || /\d/.test(d.text_cn);
				
				if (hasnumber) {
					textEl.classList.add('hasnumber');
				}

				let textstring = ""

				let spans = d.text ? d.text.split('\r') : [];
				let spans_cn = d.text_cn ? d.text_cn.split('\r') : [];
				if (spans.length == 1) {
					textstring = d.text;
				} else if (spans.length > 1) {
					textstring = '<span>';
					spans.forEach(function(d,spani){
						if (spani == spans.length - 1) {
							textstring += d + '</span>';
						} else {
							textstring += d + '</span><span>';
						}
					})
				}

				span_en.innerHTML = textstring;
				innerEl.appendChild(span_en);

				let textstring_cn = ""
				if (spans_cn.length == 1) {
					textstring_cn = d.text_cn;
				} else if (spans_cn.length > 1) {
					textstring_cn = '<span>';
					spans_cn.forEach(function(d,spani){
						if (spani == spans_cn.length - 1) {
							textstring_cn += d + '</span>';
						} else {
							textstring_cn += d + '</span><span>';
						}
					})
				}

				let span_cn = document.createElement('div');
				span_cn.classList.add('cn');
				span_cn.classList.add('g-version');
				span_cn.innerHTML = textstring_cn;
				innerEl.appendChild(span_cn);

				if (lang == "cn") {
					span_cn.classList.add('g-show');
				}

				textEl.appendChild(innerEl);
				labelscont.appendChild(textEl);

				const geometry = new THREE.CircleGeometry(1.2, 32);
				const material = new THREE.MeshBasicMaterial({
					color: +('0xff0000'),
					depthTest: false // set to true to see where the points are
				});
				const circle = new THREE.Mesh(geometry, material);

				d.pos = { x: 0, y: 0, z: 0 };
				d.pos.z =
					d.top_calc > 0.5 ? (d.top_calc - 0.5) * worldDepth : -(0.5 - d.top_calc) * worldDepth;
				d.pos.x = 
					d.left_calc > 0.5 ? (d.left_calc - 0.5) * worldWidth : -(0.5 - d.left_calc) * worldWidth;

				circle.position.set(d.pos.x, d.pos.y, d.pos.z);
				circle.rotation.x = -Math.PI / 2;
				circle.name = id;
				scene.add(circle);
			});
		};

		let prevSegment = -1;
		const animate = () => {
			now = Date.now();

			if (now - then > fpsInterval) {
				then = now - ((now - then) % fpsInterval);
				scrollPctAdj += (scrollPct - scrollPctAdj) / lerpDivider;
				frameCurr = frameLength * scrollPctAdj;

				for (let i = cameraPos.length - 1; i >= 0; i--) {
					if (frameCurr >= cameraPos[i].frame && cameraPos[i + 1]) {
						let segmentPct = (frameCurr - cameraPos[i].frame) / (cameraPos[i + 1].frame - cameraPos[i].frame), newX = valueTween(
								cameraPos[i].pos.x,
								cameraPos[i + 1].pos.x,
								segmentPct * 100,
								100,
								cameraPos[i].ease
							), newY = valueTween(
								cameraPos[i].pos.y,
								cameraPos[i + 1].pos.y,
								segmentPct * 100,
								100,
								cameraPos[i].ease
							), newZ = valueTween(
								cameraPos[i].pos.z,
								cameraPos[i + 1].pos.z,
								segmentPct * 100,
								100,
								cameraPos[i].ease
							), newAimX = valueTween(
								cameraAimPos[i].pos.x,
								cameraAimPos[i + 1].pos.x,
								segmentPct * 100,
								100,
								cameraAimPos[i].ease
							), newAimY = valueTween(
								cameraAimPos[i].pos.y,
								cameraAimPos[i + 1].pos.y,
								segmentPct * 100,
								100,
								cameraAimPos[i].ease
							), newAimZ = valueTween(
								cameraAimPos[i].pos.z,
								cameraAimPos[i + 1].pos.z,
								segmentPct * 100,
								100,
								cameraAimPos[i].ease
							);

						if (!useOrbit) {
							camera.position.set(newX, newY, newZ);
							camera.lookAt(newAimX, newAimY, newAimZ);
						}

						labels.forEach(function (d,i) {
							let id = "text-" + i;
							let textEl = document.querySelector('.' + id);
							let textpos = getScreenPos(d.pos.x, d.pos.y, d.pos.z);
							textEl.style.top = textpos.y + 'px';
							textEl.style.left = textpos.x + 'px';

							// if (textEl.classList.contains('active')) {
							// 	textEl.classList.remove('active');
							// }

							if (textEl.classList.contains('active')) {
								textEl.classList.remove('active');
							}

							if (d.frames) {
								d.frames.forEach(function(frame){
									if (frameCurr > frame[0] && frameCurr < frame[1]) {
										if (!textEl.classList.contains('active')) {
											textEl.classList.add('active');
										}
									}
								})
							} else {
								if (!textEl.classList.contains('active')) {
									textEl.classList.add('active');
								}
							}

						});

						frameSegIndex = i;

						if (prevSegment != frameSegIndex) {
							// console.log(prevSegment);
						}

						i = -1;
						prevSegment = frameSegIndex;
					}
				}
				animateThings(frameCurr);

				renderer.render(scene, camera);
			}
			myreq = requestAnimationFrame(animate);
		};

		function animateThings(frameCurr) {

			let noframes = true;
			whatwhere.forEach(function(what,i){
				let img = what.sections == "path" ? "path.png" : what.sections + ".png";
				if (frameCurr > what.frames[0] && frameCurr < what.frames[1]) {
					noframes = false;
					if (trail.material.uniforms.uSection.value != i) {
						const positionLoader = new THREE.TextureLoader();
						positionLoader.load(img, function (texture) {
							texture.minFilter = THREE.NearestFilter;
							texture.magFilter = THREE.NearestFilter;
							trail.material.uniforms.uDrawPct.value = 0.0;
							trail.material.uniforms.uDrawPctAdj.value = 0.0;
							trail.material.uniforms.uHasWritten.value = 0.0;
							trail.material.uniforms.uImageWritingPosition.value = texture;
							trail.material.uniforms.uSection.value = i;
							trail.material.uniforms.uFrames.value = what.totalFrames;
						});
					}

					if (trail.material.uniforms.uHasWritten.value != 1) {
						let drawPct = trail.material.uniforms.uDrawPct.value;
						let drawPctAdj = trail.material.uniforms.uDrawPctAdj.value;
						let increment = i == 0 ? 0.1 : 0.05;
						drawPctAdj += ((drawPct+increment) - drawPctAdj) / lerpDivider;
						trail.material.uniforms.uDrawPctAdj.value = drawPctAdj;
						
						if (drawPct > 1) {
							trail.material.uniforms.uHasWritten.value = 1.0;
							trail.material.uniforms.uDrawPct.value = 1.0;
						} else {
							trail.material.uniforms.uDrawPct.value = drawPctAdj;
						} 
					}
				}
			})

			if (trail.material) {
				mapFade += (mapFadeTarget - mapFade) * mapFadeSpeed;

				if (Math.abs(mapFadeTarget - mapFade) < 0.001) {
					mapFade = mapFadeTarget;
				}

				trail.material.uniforms.uMapFade.value = mapFade;

				// when fade completes, promote B -> A so next transition fades from the latest
				if (mapFade === 1) {
					trail.material.uniforms.uMixImageA.value = trail.material.uniforms.uMixImageB.value;
					mapFadeTarget = 0; // idle
				}
			}

			for (const item of mapbaseTimeline) {
				if (frameCurr >= item.frames[0] && frameCurr < item.frames[1]) {
					if (!trail.material) break;
					if (item.src === currentMapbaseSrc) break;

					setBaseMapNext(item.src);
					break;
				}
			}

			if (noframes) {
				trail.material.uniforms.uDrawPct.value = 0.0;
			}
		}

		container.style.height = assetHeight + 'px';

		setupScene();
		setupLights();
		addLabels();

		addPath();

		window.addEventListener('resize', onWindowResize);
		window.addEventListener('scroll', onPageScroll);

		if (debug) addDebugElems();

		cancelAnimationFrame(myreq);
		animate();
	},
	get init() {
		return this._init;
	},
	set init(value) {
		this._init = value;
	},
};

	
