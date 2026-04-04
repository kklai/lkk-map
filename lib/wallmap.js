import { createMapViewer } from './mapviewer.js';

createMapViewer({
    sectionId:    'wallmap-section',
    canvasId:     'canvas-wallmap',
    imageSrc:     'img/wallmap.png',
    imageWidth:   6000,
    imageHeight:  4021,
    // Preserve original plane dimensions (based on physical print: 91 x 61 cm)
    planeW: 258,
    planeH: 179,
    cameraDesktop: [-246.81945173936225, 46.49648610000176,  251.30454422845193],
    targetDesktop: [-28.442391621975112, -4.189398700025013, -12.878031009802637],
    cameraMobile:  [-352.46335902168045, 72.82883142313287,  246.29146863731253],
    targetMobile:  [-16.17864767023746,  -5.794172415039153, -13.255124232328482],
});
