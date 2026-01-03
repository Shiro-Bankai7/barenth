import * as THREE from 'three';
import { gsap } from 'gsap';

class InfiniteGrid {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas'),
            antialias: true,
            alpha: false
        });
        
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.gridLines = [];
        this.hoveredLine = null;
        this.hiddenGeometry = null;
        this.hintTimer = 0;
        this.ulquiorraTexture = null;
        this.isLoaded = false;
        this.colorPhase = 0;
        this.gridLayers = [];
        this.keys = {};
        this.touchStart = null;
        this.touchDelta = null;
        this.rareColorChance = 0; // Ultra rare color trigger
        this.currentRareColor = null;
        
        this.init();
        this.animate();
    }
    
    init() {
        // Set black background immediately
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Add fog for depth illusion
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);
        
        // Ambient lighting
        const ambientLight = new THREE.AmbientLight(0x00ffff, 0.3);
        this.scene.add(ambientLight);
        
        // Start loading assets
        this.loadAssets();
    }
    
    loadAssets() {
        const textureLoader = new THREE.TextureLoader();
        
        // Load texture first
        textureLoader.load('/image.png', 
            (texture) => {
                this.ulquiorraTexture = texture;
                this.createInfiniteGrid();
                this.createHiddenCipher();
                this.setupEventListeners();
                this.onLoadComplete();
            },
            undefined,
            (error) => {
                console.log('Texture loading failed, continuing without it');
                this.createInfiniteGrid();
                this.createHiddenCipher();
                this.setupEventListeners();
                this.onLoadComplete();
            }
        );
    }
    
    onLoadComplete() {
        this.isLoaded = true;
        
        // Hide loading indicator
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.transition = 'opacity 1s ease-out';
            loadingElement.style.opacity = '0';
            setTimeout(() => {
                loadingElement.style.display = 'none';
            }, 1000);
        }
        
        // Fade in renderer
        const canvas = document.getElementById('canvas');
        canvas.style.opacity = '0';
        canvas.style.transition = 'opacity 2s ease-in';
        
        setTimeout(() => {
            canvas.style.opacity = '1';
        }, 100);
    }
    
    createInfiniteGrid() {
        // Create multiple grid layers for infinite illusion
        const layerConfigs = [
            { distance: 0, scale: 1, opacity: 0.8, divisions: 50 },
            { distance: -50, scale: 1.5, opacity: 0.4, divisions: 40 },
            { distance: -100, scale: 2, opacity: 0.2, divisions: 30 },
            { distance: -200, scale: 3, opacity: 0.1, divisions: 20 },
            { distance: -400, scale: 4, opacity: 0.05, divisions: 15 }
        ];
        
        layerConfigs.forEach((config, layerIndex) => {
            const layer = new THREE.Group();
            layer.position.z = config.distance;
            
            const gridSize = 100 * config.scale;
            const gridDivisions = config.divisions;
            const lineCount = gridDivisions * 2 + 1;
            
            // Create grid material with color pulsing
            const material = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: config.opacity,
                linewidth: 1
            });
            
            // Create horizontal lines
            for (let i = 0; i < lineCount; i++) {
                const z = (i - gridDivisions) * (gridSize / gridDivisions);
                const geometry = new THREE.BufferGeometry();
                const vertices = [];
                
                for (let j = 0; j < lineCount; j++) {
                    const x = (j - gridDivisions) * (gridSize / gridDivisions);
                    vertices.push(x, 0, z);
                }
                
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                const line = new THREE.Line(geometry, material.clone());
                layer.add(line);
                this.gridLines.push(line);
                
                // Add layer-specific pulsing
                gsap.to(line.material, {
                    opacity: config.opacity * 0.5,
                    duration: 3 + layerIndex * 0.5 + Math.random() * 2,
                    repeat: -1,
                    yoyo: true,
                    ease: "power2.inOut",
                    delay: Math.random() * 2
                });
            }
            
            // Create vertical lines
            for (let i = 0; i < lineCount; i++) {
                const x = (i - gridDivisions) * (gridSize / gridDivisions);
                const geometry = new THREE.BufferGeometry();
                const vertices = [];
                
                for (let j = 0; j < lineCount; j++) {
                    const z = (j - gridDivisions) * (gridSize / gridDivisions);
                    vertices.push(x, 0, z);
                }
                
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
                const line = new THREE.Line(geometry, material.clone());
                layer.add(line);
                this.gridLines.push(line);
                
                // Add layer-specific pulsing
                gsap.to(line.material, {
                    opacity: config.opacity * 0.5,
                    duration: 3 + layerIndex * 0.5 + Math.random() * 2,
                    repeat: -1,
                    yoyo: true,
                    ease: "power2.inOut",
                    delay: Math.random() * 2
                });
            }
            
            this.gridLayers.push(layer);
            this.scene.add(layer);
            
            // Layer-specific floating animation
            gsap.to(layer.position, {
                y: layerIndex * 0.1,
                duration: 10 + layerIndex * 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
            
            gsap.to(layer.rotation, {
                y: Math.PI * 0.05 * (layerIndex + 1),
                duration: 20 + layerIndex * 5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });
        
        // Enhanced fog with multiple layers
        this.scene.fog = new THREE.FogExp2(0x000000, 0.015);
        
        // Camera movement animation
        this.animateCamera();
    }
    
    createHiddenCipher() {
        // Create disappearing figure group
        const cipherGroup = new THREE.Group();
        
        // Create multiple fading silhouettes at different distances
        for (let i = 0; i < 8; i++) {
            const distance = 10 + i * 15; // Progressive distances
            const scale = 2 / (1 + i * 0.3); // Smaller as distance increases
            const opacity = 0.05 / (1 + i * 0.5); // Fade with distance
            
            // Human silhouette geometry
            const silhouetteGeometry = new THREE.PlaneGeometry(1.5 * scale, 2.5 * scale, 4, 6);
            const silhouetteMaterial = new THREE.MeshBasicMaterial({
                map: this.ulquiorraTexture,
                transparent: true,
                opacity: opacity,
                wireframe: false
            });
            
            const silhouette = new THREE.Mesh(silhouetteGeometry, silhouetteMaterial);
            
            // Position in a disappearing line into the distance
            silhouette.position.set(
                (Math.random() - 0.5) * 20,
                Math.random() * 5,
                -distance
            );
            
            // Random rotation to break recognizability
            silhouette.rotation.y = Math.random() * Math.PI * 0.5;
            silhouette.rotation.x = (Math.random() - 0.5) * 0.3;
            
            cipherGroup.add(silhouette);
            
            // Individual floating animation for each silhouette
            gsap.to(silhouette.position, {
                y: silhouette.position.y + 0.5,
                duration: 8 + i * 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: i * 0.5
            });
            
            gsap.to(silhouette.rotation, {
                y: silhouette.rotation.y + Math.PI * 0.1,
                duration: 12 + i * 3,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: i * 0.5
            });
        }
        
        // Wing-like fragments scattered in the distance
        for (let i = 0; i < 6; i++) {
            const wingGeometry = new THREE.ConeGeometry(0.1, 1.5, 3);
            const wingMaterial = new THREE.MeshBasicMaterial({
                map: this.ulquiorraTexture,
                transparent: true,
                opacity: 0.02,
                wireframe: true
            });
            
            const wingFragment = new THREE.Mesh(wingGeometry, wingMaterial);
            wingFragment.position.set(
                (Math.random() - 0.5) * 30,
                Math.random() * 10,
                -20 - Math.random() * 40
            );
            wingFragment.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            cipherGroup.add(wingFragment);
        }
        
        // Distant glowing sphere (Cero-like)
        const distantCeroGeometry = new THREE.SphereGeometry(0.5, 6, 6);
        const distantCeroMaterial = new THREE.MeshBasicMaterial({
            color: 0x002200,
            transparent: true,
            opacity: 0.01,
            emissive: 0x001100,
            emissiveIntensity: 0.05
        });
        const distantCero = new THREE.Mesh(distantCeroGeometry, distantCeroMaterial);
        distantCero.position.set(0, 5, -50);
        cipherGroup.add(distantCero);
        
        // Very faint horn fragments far in distance
        for (let i = 0; i < 4; i++) {
            const hornGeometry = new THREE.ConeGeometry(0.05, 0.3, 3);
            const hornMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.01
            });
            
            const horn = new THREE.Mesh(hornGeometry, hornMaterial);
            horn.position.set(
                (Math.random() - 0.5) * 25,
                Math.random() * 8 + 2,
                -30 - Math.random() * 20
            );
            horn.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            cipherGroup.add(horn);
        }
        
        this.hiddenGeometry = cipherGroup;
        this.scene.add(cipherGroup);
        
        // Very slow group movement to enhance disappearing effect
        gsap.to(cipherGroup.position, {
            z: -5,
            duration: 60,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut"
        });
        
        // Distant Cero pulsing
        gsap.to(distantCeroMaterial, {
            opacity: 0.03,
            emissiveIntensity: 0.1,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut"
        });
    }
    
    animateCamera() {
        gsap.to(this.camera.position, {
            x: 5,
            y: 8,
            z: 15,
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
            onUpdate: () => {
                this.camera.lookAt(0, 0, 0);
            }
        });
        
        // Subtle rotation
        gsap.to(this.scene.rotation, {
            y: Math.PI * 0.1,
            duration: 30,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut"
        });
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (event) => this.onMouseMove(event));
        window.addEventListener('click', (event) => this.onClick(event));
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));
        
        // Mobile touch controls
        window.addEventListener('touchstart', (event) => this.onTouchStart(event));
        window.addEventListener('touchmove', (event) => this.onTouchMove(event));
        window.addEventListener('touchend', (event) => this.onTouchEnd(event));
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Parallax effect
        const parallaxX = this.mouse.x * 2;
        const parallaxY = this.mouse.y * 2;
        
        gsap.to(this.camera.position, {
            x: parallaxX,
            y: 5 + parallaxY,
            duration: 1,
            ease: "power2.out"
        });
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.touchStart = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            this.touchDelta = { x: 0, y: 0 };
        }
    }
    
    onTouchMove(event) {
        if (event.touches.length === 1 && this.touchStart) {
            event.preventDefault();
            
            const currentTouch = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            
            this.touchDelta = {
                x: currentTouch.x - this.touchStart.x,
                y: currentTouch.y - this.touchStart.y
            };
            
            // Convert to normalized device coordinates
            this.mouse.x = (currentTouch.x / window.innerWidth) * 2 - 1;
            this.mouse.y = -(currentTouch.y / window.innerHeight) * 2 + 1;
            
            // Mobile parallax effect
            const parallaxX = this.mouse.x * 3;
            const parallaxY = this.mouse.y * 3;
            
            gsap.to(this.camera.position, {
                x: parallaxX,
                y: 5 + parallaxY,
                duration: 0.5,
                ease: "power2.out"
            });
        }
    }
    
    onTouchEnd(event) {
        if (this.touchDelta) {
            // Swipe detection for layer movement
            const swipeThreshold = 50;
            
            if (Math.abs(this.touchDelta.x) > swipeThreshold) {
                // Horizontal swipe - rotate layers
                const direction = this.touchDelta.x > 0 ? 1 : -1;
                this.gridLayers.forEach((layer, index) => {
                    gsap.to(layer.rotation, {
                        y: layer.rotation.y + (Math.PI * 0.1 * direction),
                        duration: 1,
                        ease: "power2.out"
                    });
                });
            }
            
            if (Math.abs(this.touchDelta.y) > swipeThreshold) {
                // Vertical swipe - move layers forward/backward
                const direction = this.touchDelta.y > 0 ? 1 : -1;
                this.gridLayers.forEach((layer, index) => {
                    gsap.to(layer.position, {
                        z: layer.position.z + (10 * direction),
                        duration: 1,
                        ease: "power2.out"
                    });
                });
            }
            
            // Tap for color pulse (small delta = tap)
            if (Math.abs(this.touchDelta.x) < 10 && Math.abs(this.touchDelta.y) < 10) {
                this.createColorPulse();
            }
        }
        
        this.touchStart = null;
        this.touchDelta = null;
    }
    
    onKeyDown(event) {
        this.keys[event.key.toLowerCase()] = true;
        
        // Keyboard effects
        switch(event.key.toLowerCase()) {
            case 'w':
                // Move forward through layers
                this.gridLayers.forEach((layer, index) => {
                    gsap.to(layer.position, {
                        z: layer.position.z + 10,
                        duration: 1,
                        ease: "power2.out"
                    });
                });
                break;
            case 's':
                // Move backward through layers
                this.gridLayers.forEach((layer, index) => {
                    gsap.to(layer.position, {
                        z: layer.position.z - 10,
                        duration: 1,
                        ease: "power2.out"
                    });
                });
                break;
            case 'a':
                // Rotate layers left
                this.gridLayers.forEach((layer, index) => {
                    gsap.to(layer.rotation, {
                        y: layer.rotation.y - Math.PI * 0.1,
                        duration: 1,
                        ease: "power2.out"
                    });
                });
                break;
            case 'd':
                // Rotate layers right
                this.gridLayers.forEach((layer, index) => {
                    gsap.to(layer.rotation, {
                        y: layer.rotation.y + Math.PI * 0.1,
                        duration: 1,
                        ease: "power2.out"
                    });
                });
                break;
            case ' ':
                // Space - create color pulse
                this.createColorPulse();
                break;
            case 'r':
                // R - reset layers
                this.resetLayers();
                break;
        }
    }
    
    onKeyUp(event) {
        this.keys[event.key.toLowerCase()] = false;
    }
    
    createColorPulse() {
        // Create expanding cyan pulse effect
        const pulseGeometry = new THREE.RingGeometry(0.1, 5, 32);
        const pulseMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Pure cyan
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.rotation.x = -Math.PI / 2;
        pulse.position.set(0, 0, 0);
        this.scene.add(pulse);
        
        // Animate pulse
        gsap.to(pulse.scale, {
            x: 20,
            y: 20,
            z: 20,
            duration: 2,
            ease: "power2.out"
        });
        
        gsap.to(pulse.material, {
            opacity: 0,
            duration: 2,
            ease: "power2.out",
            onComplete: () => {
                this.scene.remove(pulse);
                pulse.geometry.dispose();
                pulse.material.dispose();
            }
        });
    }
    
    resetLayers() {
        // Reset all layers to original positions
        const originalPositions = [0, -50, -100, -200, -400];
        this.gridLayers.forEach((layer, index) => {
            gsap.to(layer.position, {
                x: 0,
                y: 0,
                z: originalPositions[index],
                duration: 2,
                ease: "power2.inOut"
            });
            
            gsap.to(layer.rotation, {
                x: 0,
                y: 0,
                z: 0,
                duration: 2,
                ease: "power2.inOut"
            });
        });
    }
    
    onClick(event) {
        // Create ripple effect at click position
        const rippleGeometry = new THREE.RingGeometry(0.1, 2, 32);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
        ripple.rotation.x = -Math.PI / 2;
        
        // Position ripple at click point on grid
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.gridLines);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            ripple.position.set(point.x, 0.1, point.z);
            this.scene.add(ripple);
            
            // Animate ripple
            gsap.to(ripple.scale, {
                x: 5,
                y: 5,
                z: 5,
                duration: 1,
                ease: "power2.out"
            });
            
            gsap.to(ripple.material, {
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                onComplete: () => {
                    this.scene.remove(ripple);
                    ripple.geometry.dispose();
                    ripple.material.dispose();
                }
            });
        } else {
            // If no intersection, create ripple at origin
            ripple.position.set(0, 0.1, 0);
            this.scene.add(ripple);
            
            gsap.to(ripple.scale, {
                x: 3,
                y: 3,
                z: 3,
                duration: 1,
                ease: "power2.out"
            });
            
            gsap.to(ripple.material, {
                opacity: 0,
                duration: 1,
                ease: "power2.out",
                onComplete: () => {
                    this.scene.remove(ripple);
                    ripple.geometry.dispose();
                    ripple.material.dispose();
                }
            });
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Ultra rare color chance (1 in 1000 frames)
        this.rareColorChance++;
        if (this.rareColorChance > 1000) {
            this.rareColorChance = 0;
            this.currentRareColor = new THREE.Color().setHSL(0.75, 1, 0.6); // Ultra rare magenta
        } else if (this.rareColorChance > 100) {
            this.currentRareColor = null; // Reset after brief appearance
        }
        
        // Subtle color variation within cyan range with ultra rare color
        this.colorPhase += 0.005;
        const brightness = (Math.sin(this.colorPhase) + 1) / 2; // Oscillate between 0 and 1
        
        // Apply subtle brightness variation to grid lines
        this.gridLines.forEach((line, index) => {
            const offset = index * 0.1;
            const lineBrightness = 0.7 + (Math.sin(this.colorPhase + offset) * 0.3); // 70% to 100% brightness
            
            // Use ultra rare color or cyan
            let lineColor;
            if (this.currentRareColor && Math.random() < 0.01) { // Only 1% of lines get rare color
                lineColor = this.currentRareColor.clone();
            } else {
                lineColor = new THREE.Color().setHSL(0.5, 1, lineBrightness * 0.5); // Pure cyan with brightness variation
            }
            
            line.material.color = lineColor;
            
            // Subtle grid animation
            line.material.opacity = 0.6 + Math.sin(Date.now() * 0.001 + offset) * 0.2;
        });
        
        // Dynamic fog based on mouse position
        const fogDensity = 0.015 + Math.abs(this.mouse.y) * 0.01;
        this.scene.fog.density = fogDensity;
        
        // Keyboard-based camera movement
        if (this.keys['w']) this.camera.position.z -= 0.5;
        if (this.keys['s']) this.camera.position.z += 0.5;
        if (this.keys['a']) this.camera.position.x -= 0.5;
        if (this.keys['d']) this.camera.position.x += 0.5;
        
        // Occasionally reveal hints from hidden cipher
        this.hintTimer++;
        if (this.hintTimer % 600 === 0 && this.hiddenGeometry) {
            // Briefly increase opacity of one element
            const children = this.hiddenGeometry.children;
            const randomChild = children[Math.floor(Math.random() * children.length)];
            gsap.to(randomChild.material, {
                opacity: 0.15,
                duration: 0.5,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            });
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the infinite grid
new InfiniteGrid();
