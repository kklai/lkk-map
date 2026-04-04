import { createMapViewer } from './mapviewer.js';

createMapViewer({
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
