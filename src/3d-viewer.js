import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class RoofViewer {
  constructor(canvasId, onSelectPart) {
    this.canvas = document.getElementById(canvasId);
    this.onSelectPart = onSelectPart;
    if (!this.canvas) return;

    this.parent = this.canvas.parentElement;
    this.width = this.parent.clientWidth || 600;
    this.height = this.parent.clientHeight || 550;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Interactive components
    this.parts = {};
    this.hoveredPart = null;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
    this.createModel();
    this.setupLights();
    this.animate();

    window.addEventListener('resize', this.onResize.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('click', this.onClick.bind(this));
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b0c0f');

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    
    // Mobile friendly camera distance adjustment
    if (this.width < 768) {
      this.camera.position.set(6, 5.2, 7.2);
    } else {
      this.camera.position.set(5, 4, 6);
    }

    // Renderer - Bind directly to the canvas in index.html
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 12;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 20;
    dirLight.shadow.bias = -0.001;
    this.scene.add(dirLight);

    // Subtle warm point light to highlight metal reflections
    const pointLight = new THREE.PointLight('#d4af37', 1.8, 10);
    pointLight.position.set(-2, 3, -1);
    this.scene.add(pointLight);
  }

  createModel() {
    // Group to hold entire roof
    const roofGroup = new THREE.Group();
    
    // Luxury PBR Materials
    const shinglesMat = new THREE.MeshStandardMaterial({
      color: '#2a2d34',
      roughness: 0.85,
      metalness: 0.1,
      bumpScale: 0.05
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: '#c5a059', // champagne gold
      roughness: 0.25,
      metalness: 0.9
    });

    const flashingMat = new THREE.MeshStandardMaterial({
      color: '#4e535c', // gray metal
      roughness: 0.4,
      metalness: 0.8
    });

    const guttersMat = new THREE.MeshStandardMaterial({
      color: '#1a1b1e', // dark matte steel
      roughness: 0.5,
      metalness: 0.7
    });

    const houseBaseMat = new THREE.MeshStandardMaterial({
      color: '#121316',
      roughness: 0.9,
      metalness: 0.1
    });

    // 1. House Base (Minimalist representation)
    const baseGeo = new THREE.BoxGeometry(3, 1.5, 3);
    const houseBase = new THREE.Mesh(baseGeo, houseBaseMat);
    houseBase.position.y = 0.75;
    houseBase.receiveShadow = true;
    roofGroup.add(houseBase);

    // 2. Slate Shingles Slope (Right side, positive X)
    const shinglesSlopeGeo = new THREE.BoxGeometry(1.9, 0.1, 3.2);
    const shinglesSlope = new THREE.Mesh(shinglesSlopeGeo, shinglesMat);
    shinglesSlope.position.set(0.75, 1.85, 0);
    shinglesSlope.rotation.z = -Math.PI / 6; // 30 deg slope
    shinglesSlope.castShadow = true;
    shinglesSlope.receiveShadow = true;
    shinglesSlope.userData = { partId: 'shingles' };
    roofGroup.add(shinglesSlope);
    this.parts['shingles'] = shinglesSlope;

    // 3. Standing Seam Metal Slope (Left side, negative X)
    const metalSlopeGeo = new THREE.BoxGeometry(1.9, 0.1, 3.2);
    const metalSlope = new THREE.Mesh(metalSlopeGeo, metalMat);
    metalSlope.position.set(-0.75, 1.85, 0);
    metalSlope.rotation.z = Math.PI / 6; // 30 deg slope
    metalSlope.castShadow = true;
    metalSlope.receiveShadow = true;
    metalSlope.userData = { partId: 'metal' };
    roofGroup.add(metalSlope);
    this.parts['metal'] = metalSlope;

    // Add metallic ribs/seams for standing seam metal look
    const seamCount = 6;
    for (let i = 0; i < seamCount; i++) {
      const ribGeo = new THREE.BoxGeometry(0.02, 0.05, 3.2);
      const rib = new THREE.Mesh(ribGeo, metalMat);
      // Even spacing along width of metal slope
      rib.position.set(0, 0.06, 0);
      metalSlope.add(rib);
      // Position rib locally
      rib.position.x = -0.7 + (i * 1.4) / (seamCount - 1);
    }

    // 4. Ridge Cap/Flashing (Along the peak - Z axis)
    const capGeo = new THREE.ConeGeometry(0.12, 3.24, 4);
    const ridgeCap = new THREE.Mesh(capGeo, flashingMat);
    ridgeCap.rotation.x = Math.PI / 2;
    ridgeCap.rotation.y = Math.PI / 4;
    ridgeCap.position.set(0, 2.32, 0);
    ridgeCap.castShadow = true;
    ridgeCap.userData = { partId: 'flashing' };
    roofGroup.add(ridgeCap);
    this.parts['flashing'] = ridgeCap;

    // Add valley flashing trims
    const valleyGeoL = new THREE.BoxGeometry(0.08, 0.02, 3.2);
    const valleyL = new THREE.Mesh(valleyGeoL, flashingMat);
    valleyL.position.set(-1.62, 1.4, 0);
    valleyL.rotation.z = Math.PI / 6;
    roofGroup.add(valleyL);

    const valleyGeoR = new THREE.BoxGeometry(0.08, 0.02, 3.2);
    const valleyR = new THREE.Mesh(valleyGeoR, flashingMat);
    valleyR.position.set(1.62, 1.4, 0);
    valleyR.rotation.z = -Math.PI / 6;
    roofGroup.add(valleyR);

    // 5. Gutters (Along bottom edges)
    // Left gutter
    const gutterLGeo = new THREE.BoxGeometry(0.1, 0.1, 3.3);
    const gutterL = new THREE.Mesh(gutterLGeo, guttersMat);
    gutterL.position.set(-1.65, 1.34, 0);
    gutterL.castShadow = true;
    gutterL.userData = { partId: 'gutters' };
    roofGroup.add(gutterL);
    this.parts['gutters'] = gutterL;

    // Right gutter
    const gutterRGeo = new THREE.BoxGeometry(0.1, 0.1, 3.3);
    const gutterR = new THREE.Mesh(gutterRGeo, guttersMat);
    gutterR.position.set(1.65, 1.34, 0);
    gutterR.castShadow = true;
    gutterR.userData = { partId: 'gutters' };
    roofGroup.add(gutterR);

    // Downspouts
    const spoutsGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.3, 8);
    
    const spoutLF = new THREE.Mesh(spoutsGeo, guttersMat);
    spoutLF.position.set(-1.65, 0.7, 1.5);
    roofGroup.add(spoutLF);

    const spoutRF = new THREE.Mesh(spoutsGeo, guttersMat);
    spoutRF.position.set(1.65, 0.7, 1.5);
    roofGroup.add(spoutRF);

    this.scene.add(roofGroup);
    
    // Lift model up slightly for rotation visibility
    roofGroup.position.y = -0.2;
    this.roofGroup = roofGroup;
  }

  onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / this.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const interactableObjects = Object.values(this.parts);
    const intersects = this.raycaster.intersectObjects(interactableObjects);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const partId = hitObject.userData.partId;

      if (this.hoveredPart !== partId) {
        this.resetHoverState();
        this.hoveredPart = partId;
        this.setPartGlow(partId, true);
        this.canvas.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredPart) {
        this.resetHoverState();
        this.canvas.style.cursor = 'grab';
      }
    }
  }

  onClick(event) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const interactableObjects = Object.values(this.parts);
    const intersects = this.raycaster.intersectObjects(interactableObjects);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      const partId = hitObject.userData.partId;
      this.onSelectPart(partId);
    }
  }

  setPartGlow(partId, isGlow) {
    const object = this.parts[partId];
    if (!object) return;

    if (isGlow) {
      object.material.emissive.setHex(0x554411);
      object.material.emissiveIntensity = 0.5;
    } else {
      object.material.emissive.setHex(0x000000);
      object.material.emissiveIntensity = 0;
    }
  }

  resetHoverState() {
    if (this.hoveredPart) {
      this.setPartGlow(this.hoveredPart, false);
      this.hoveredPart = null;
    }
  }

  onResize() {
    this.width = this.parent.clientWidth || 600;
    this.height = this.parent.clientHeight || 550;

    // Responsive camera position update
    if (this.width < 768) {
      this.camera.position.set(6, 5.2, 7.2);
    } else {
      this.camera.position.set(5, 4, 6);
    }

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.controls.update();

    // Slow drift rotation when user isn't interacting
    if (this.roofGroup && this.controls.state === -1) {
      this.roofGroup.rotation.y += 0.0015;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Minimal 3D Roof rotator for Hero background (glowing wireframe)
export function initHero3DRotator(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const parent = canvas.parentElement;
  let width = parent.clientWidth || 400;
  let height = parent.clientHeight || 400;

  const scene = new THREE.Scene();
  
  // Camera
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  
  // Responsive camera position for wireframe
  if (width < 768) {
    camera.position.set(0, 3.2, 6.2);
  } else {
    camera.position.set(0, 2.5, 5);
  }

  // Renderer - Bind directly
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Wireframe model group
  const wireframeGroup = new THREE.Group();

  // Create clean lines for roof wireframe
  const roofLineMat = new THREE.LineBasicMaterial({ color: '#c5a059', linewidth: 1.5 });
  
  // Custom roof wireframe geometry points
  const points = [
    new THREE.Vector3(-1.5, 0, -1.5), new THREE.Vector3(0, 1, -1.5), // Back left slope
    new THREE.Vector3(1.5, 0, -1.5), new THREE.Vector3(0, 1, -1.5),  // Back right slope
    new THREE.Vector3(-1.5, 0, 1.5), new THREE.Vector3(0, 1, 1.5),   // Front left slope
    new THREE.Vector3(1.5, 0, 1.5), new THREE.Vector3(0, 1, 1.5),    // Front right slope
    
    new THREE.Vector3(0, 1, -1.5), new THREE.Vector3(0, 1, 1.5),      // Ridge cap
    new THREE.Vector3(-1.5, 0, -1.5), new THREE.Vector3(-1.5, 0, 1.5), // Left eave
    new THREE.Vector3(1.5, 0, -1.5), new THREE.Vector3(1.5, 0, 1.5),  // Right eave
    new THREE.Vector3(-1.5, 0, -1.5), new THREE.Vector3(1.5, 0, -1.5), // Back eave
    new THREE.Vector3(-1.5, 0, 1.5), new THREE.Vector3(1.5, 0, 1.5),   // Front eave
  ];

  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const lineSegment = new THREE.LineSegments(lineGeo, roofLineMat);
  wireframeGroup.add(lineSegment);

  // Add subtle base outline
  const basePoints = [
    new THREE.Vector3(-1.3, -0.6, -1.3), new THREE.Vector3(1.3, -0.6, -1.3),
    new THREE.Vector3(1.3, -0.6, -1.3), new THREE.Vector3(1.3, -0.6, 1.3),
    new THREE.Vector3(1.3, -0.6, 1.3), new THREE.Vector3(-1.3, -0.6, 1.3),
    new THREE.Vector3(-1.3, -0.6, 1.3), new THREE.Vector3(-1.3, -0.6, -1.3),

    new THREE.Vector3(-1.3, -0.6, -1.3), new THREE.Vector3(-1.5, 0, -1.5),
    new THREE.Vector3(1.3, -0.6, -1.3), new THREE.Vector3(1.5, 0, -1.5),
    new THREE.Vector3(1.3, -0.6, 1.3), new THREE.Vector3(1.5, 0, 1.5),
    new THREE.Vector3(-1.3, -0.6, 1.3), new THREE.Vector3(-1.5, 0, 1.5),
  ];
  const baseLineGeo = new THREE.BufferGeometry().setFromPoints(basePoints);
  const baseLineSegments = new THREE.LineSegments(baseLineGeo, new THREE.LineBasicMaterial({ color: '#4a4d55' }));
  wireframeGroup.add(baseLineSegments);

  scene.add(wireframeGroup);

  // Light
  const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
  scene.add(ambientLight);

  // Interactive mouse influence
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
  });

  const animate = () => {
    requestAnimationFrame(animate);

    // Auto rotate
    wireframeGroup.rotation.y += 0.0025;

    // Mouse movement parallax interpolation
    targetX += (mouseX * 0.5 - targetX) * 0.05;
    targetY += (mouseY * 0.3 - targetY) * 0.05;

    wireframeGroup.rotation.y += targetX * 0.1;
    wireframeGroup.rotation.x = targetY * 0.5;

    renderer.render(scene, camera);
  };

  animate();

  window.addEventListener('resize', () => {
    width = parent.clientWidth || 400;
    height = parent.clientHeight || 400;

    if (width < 768) {
      camera.position.set(0, 3.2, 6.2);
    } else {
      camera.position.set(0, 2.5, 5);
    }

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
}
