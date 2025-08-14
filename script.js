// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1a1a1a); // Dark charcoal background
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
document.getElementById('container').appendChild(renderer.domElement);

// Camera position
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);

// Orbit controls with responsive settings
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = true;
controls.enableRotate = true;

// Responsive camera settings
const isMobile = window.innerWidth <= 768;
const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

if (isMobile) {
    // Mobile optimizations
    controls.enablePan = false; // Disable pan on mobile to prevent accidental movement
    controls.maxDistance = 30;
    controls.minDistance = 5;
    camera.position.set(15, 15, 15); // Further back for mobile
} else if (isTablet) {
    // Tablet optimizations
    controls.maxDistance = 25;
    controls.minDistance = 8;
    camera.position.set(12, 12, 12);
} else {
    // Desktop settings
    controls.maxDistance = 40;
    controls.minDistance = 3;
    camera.position.set(10, 10, 10);
}

// Grid parameters
const gridSize = 10;
const gridDivisions = 20;
const tickSize = 0.5;

// CDF visualization variables
let currentCDFType = 'continuous';
let cdfGroup = new THREE.Group();

// Create coordinate axes
function createAxes() {
    const axesGroup = new THREE.Group();
    
    // X-axis (Red)
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-gridSize, 0, 0),
        new THREE.Vector3(gridSize, 0, 0)
    ]);
    const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
    axesGroup.add(xAxis);

    // Y-axis (Blue)
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -gridSize, 0),
        new THREE.Vector3(0, gridSize, 0)
    ]);
    const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });
    const yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
    axesGroup.add(yAxis);

    // Z-axis (Green)
    const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -gridSize),
        new THREE.Vector3(0, 0, gridSize)
    ]);
    const zAxisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
    const zAxis = new THREE.Line(zAxisGeometry, zAxisMaterial);
    axesGroup.add(zAxis);

    // Create axis labels
    const createAxisLabel = (text, color, position) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;
        
        // Clear canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        context.fillStyle = color;
        context.font = 'bold 32px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(4, 2, 1);
        
        return sprite;
    };

    // Add axis labels at the ends
    axesGroup.add(createAxisLabel('X', '#ff0000', new THREE.Vector3(gridSize + 2, 0, 0)));
    axesGroup.add(createAxisLabel('Y', '#0000ff', new THREE.Vector3(0, gridSize + 2, 0)));
    axesGroup.add(createAxisLabel('Z', '#00ff00', new THREE.Vector3(0, 0, gridSize + 2)));

    return axesGroup;
}

// Create grid
function createGrid() {
    const gridGroup = new THREE.Group();
    
    // Create grid helper (XY plane) - Red vertical lines, Blue horizontal lines
    const gridHelper = new THREE.GridHelper(gridSize * 2, gridDivisions * 2, 0xff0000, 0x0000ff);
    gridGroup.add(gridHelper);

    // Create additional grids for YZ and XZ planes
    const gridHelperYZ = new THREE.GridHelper(gridSize * 2, gridDivisions * 2, 0xff0000, 0x0000ff);
    gridHelperYZ.rotation.x = Math.PI / 2;
    gridGroup.add(gridHelperYZ);

    const gridHelperXZ = new THREE.GridHelper(gridSize * 2, gridDivisions * 2, 0xff0000, 0x0000ff);
    gridHelperXZ.rotation.z = Math.PI / 2;
    gridGroup.add(gridHelperXZ);

    return gridGroup;
}

// Create tick marks and numbers
function createTicks() {
    const ticksGroup = new THREE.Group();
    
    // Create tick marks for each axis
    for (let i = -gridSize; i <= gridSize; i++) {
        if (i === 0) continue; // Skip origin
        
        // X-axis ticks (vertical lines) - Red
        const xTickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(i, -tickSize, 0),
            new THREE.Vector3(i, tickSize, 0)
        ]);
        const xTickMaterial = new THREE.LineBasicMaterial({ color: 0xff6666 });
        const xTick = new THREE.Line(xTickGeometry, xTickMaterial);
        ticksGroup.add(xTick);

        // Y-axis ticks (vertical lines) - Blue
        const yTickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-tickSize, i, 0),
            new THREE.Vector3(tickSize, i, 0)
        ]);
        const yTickMaterial = new THREE.LineBasicMaterial({ color: 0x6666ff });
        const yTick = new THREE.Line(yTickGeometry, yTickMaterial);
        ticksGroup.add(yTick);

        // Z-axis ticks (horizontal lines on XZ plane) - Green
        const zTickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-tickSize, 0, i),
            new THREE.Vector3(tickSize, 0, i)
        ]);
        const zTickMaterial = new THREE.LineBasicMaterial({ color: 0x66ff66 });
        const zTick = new THREE.Line(zTickGeometry, zTickMaterial);
        ticksGroup.add(zTick);
    }

    return ticksGroup;
}

// Create number labels
function createLabels() {
    const labelsGroup = new THREE.Group();
    
    // Responsive label settings
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    let canvasWidth = 64;
    let canvasHeight = 32;
    let fontSize = 'bold 16px monospace';
    let scale = 2;
    
    if (isMobile) {
        canvasWidth = 48;
        canvasHeight = 24;
        fontSize = 'bold 12px monospace';
        scale = 1.5;
    } else if (isTablet) {
        canvasWidth = 56;
        canvasHeight = 28;
        fontSize = 'bold 14px monospace';
        scale = 1.8;
    }
    
    // Create labels for each axis
    for (let i = -gridSize; i <= gridSize; i++) {
        if (i === 0) continue; // Skip origin
        
        // Create individual canvas for each number
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Clear canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Add text (no background)
        context.fillStyle = '#ffffff'; // White text
        context.font = fontSize;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(i.toString(), canvas.width / 2, canvas.height / 2);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(material);
        
        // X-axis labels (positioned along X-axis)
        const xLabel = sprite.clone();
        xLabel.position.set(i, 0, -1.5);
        xLabel.scale.set(scale, scale * 0.5, 1);
        labelsGroup.add(xLabel);
        
        // Y-axis labels (positioned along Y-axis)
        const yLabel = sprite.clone();
        yLabel.position.set(-1.5, i, 0);
        yLabel.scale.set(scale, scale * 0.5, 1);
        labelsGroup.add(yLabel);
        
        // Z-axis labels (positioned along Z-axis)
        const zLabel = sprite.clone();
        zLabel.position.set(-1.5, 0, i);
        zLabel.scale.set(scale, scale * 0.5, 1);
        labelsGroup.add(zLabel);
    }
    
    return labelsGroup;
}

// Create CDF visualization functions
function createContinuousCDF() {
    const cdfGroup = new THREE.Group();
    
    // Create a smooth continuous CDF surface on the XZ plane
    const geometry = new THREE.PlaneGeometry(20, 20, 40, 40);
    const material = new THREE.MeshLambertMaterial({ 
        color: 0xff00ff, // Bright magenta
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    
    // Apply CDF function to vertices
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getY(i); // Y coordinate becomes Z for XZ plane
        
        // Normalize coordinates to [0,1] range
        const nx = (x + 10) / 20;
        const nz = (z + 10) / 20;
        
        // Simple bivariate normal CDF approximation
        const y = Math.min(1, Math.max(0, nx * nz * (1 + 0.3 * Math.sin(nx * Math.PI) * Math.cos(nz * Math.PI))));
        
        positions.setY(i, y * 2); // Set Y coordinate for height
        positions.setZ(i, z); // Keep Z coordinate as is
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1, 0); // Position on XZ plane, close to origin
    cdfGroup.add(mesh);
    
    // Add wireframe for better visibility
    const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 })
    );
    wireframe.position.set(0, 1, 0);
    cdfGroup.add(wireframe);
    
    return cdfGroup;
}

function createDiscreteCDF() {
    const cdfGroup = new THREE.Group();
    
    // Create discrete CDF as a series of steps on the XZ plane
    const stepSize = 1;
    const steps = 20;
    
    for (let i = 0; i < steps; i++) {
        for (let j = 0; j < steps; j++) {
            const x = (i - steps/2) * stepSize;
            const z = (j - steps/2) * stepSize;
            const height = Math.min(1, (i + 1) * (j + 1) / (steps * steps)) * 1.5;
            
            const geometry = new THREE.BoxGeometry(stepSize * 0.9, height, stepSize * 0.9);
            const material = new THREE.MeshLambertMaterial({ 
                color: 0x00ffff, // Bright cyan
                transparent: true,
                opacity: 0.7
            });
            
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(x, height / 2, z);
            cdfGroup.add(cube);
            
            // Add wireframe for better visibility
            const wireframe = new THREE.LineSegments(
                new THREE.WireframeGeometry(geometry),
                new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 })
            );
            wireframe.position.set(x, height / 2, z);
            cdfGroup.add(wireframe);
        }
    }
    
    return cdfGroup;
}

function updateCDF() {
    // Remove existing CDF
    scene.remove(cdfGroup);
    
    // Create new CDF based on current type
    if (currentCDFType === 'continuous') {
        cdfGroup = createContinuousCDF();
    } else {
        cdfGroup = createDiscreteCDF();
    }
    
    scene.add(cdfGroup);
}

// Toggle functions
function switchToContinuous() {
    currentCDFType = 'continuous';
    updateCDF();
    updateToggleButtons();
}

function switchToDiscrete() {
    currentCDFType = 'discrete';
    updateCDF();
    updateToggleButtons();
}

function updateToggleButtons() {
    const buttons = document.querySelectorAll('.toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (currentCDFType === 'continuous') {
        buttons[0].classList.add('active');
    } else {
        buttons[1].classList.add('active');
    }
}

// Add elements to scene
scene.add(createAxes());
scene.add(createGrid());
scene.add(createTicks());
scene.add(createLabels());
updateCDF(); // Add initial CDF

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize and orientation changes
function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update camera aspect ratio
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(width, height);
    
    // Update pixel ratio for performance
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Recalculate responsive settings
    const isMobile = width <= 768;
    const isTablet = width > 768 && width <= 1024;
    
    if (isMobile) {
        controls.enablePan = false;
        controls.maxDistance = 30;
        controls.minDistance = 5;
    } else if (isTablet) {
        controls.enablePan = true;
        controls.maxDistance = 25;
        controls.minDistance = 8;
    } else {
        controls.enablePan = true;
        controls.maxDistance = 40;
        controls.minDistance = 3;
    }
}

// Listen for resize and orientation changes
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
    // Wait for orientation change to complete
    setTimeout(handleResize, 100);
});

// Handle touch events for better mobile experience
renderer.domElement.addEventListener('touchstart', (event) => {
    event.preventDefault();
}, { passive: false });

renderer.domElement.addEventListener('touchmove', (event) => {
    event.preventDefault();
}, { passive: false });

// Start animation
animate();
