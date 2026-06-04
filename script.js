let sound; // Holds the currently loaded audio file
let meydaAnalyzer; // Meyda analyzer for extracting audio features
let currentSoundIndex = 0; // Tracks current sound in the playlist
let soundFiles = ['Ex2_sound1.wav', 'Ex2_sound2.wav', 'Ex2_sound3.wav']; // List of audio files
let isPlaying = false; // Tracks play/pause state
let lastFrame = null; // Stores last audio features for static display when paused
let smoothedRolloff = 0; // Smoothed spectral rolloff for Sound 3 visuals
let smoothedZcr = 0; // Smoothed zero-crossing rate for Sound 3 visuals
let smoothedCentroid = 0; // Smoothed spectral centroid for Sound 3 visuals
let smoothedAmpEnergy = 0; // Smoothed amplitude energy for Sound 3 visuals
let smoothedEnergy = 0; // Smoothed RMS energy for Sound 2 visuals
let smoothedFlatness = 0; // Smoothed spectral flatness for Sound 2 visuals
let smoothedChromaMean = 0; // Smoothed chroma mean for Sound 2 visuals

// Preload the current sound file to ensure it’s ready before setup
function preload() {
    // Loads the sound file at currentSoundIndex and sets up end callback
    sound = loadSound(soundFiles[currentSoundIndex], () => {
        // When sound ends, stop playback and analyzer, clear last frame
        sound.onended(() => {
            isPlaying = false;
            meydaAnalyzer.stop();
            lastFrame = null;
        });
    });
}

// Initialize canvas, UI, and Meyda analyzer
function setup() {
    // Create a 3D canvas (800x600) using WEBGL for 3D rendering
    createCanvas(800, 600, WEBGL);
    // Set color mode to HSB for easier hue-based color manipulation
    colorMode(HSB, 360, 100, 100, 255);
    // Set initial background to black
    background(0);

    // Select audio features for Meyda based on current sound
    let features = [];
    if (currentSoundIndex === 0) {
        // Sound 1: Uses RMS (amplitude), spectral centroid (frequency brightness), chroma (pitch classes)
        features = ['rms', 'spectralCentroid', 'chroma'];
    } else if (currentSoundIndex === 1) {
        // Sound 2: Uses energy (RMS), spectral flatness (noisiness), chroma, RMS
        features = ['energy', 'spectralFlatness', 'chroma', 'rms'];
    } else {
        // Sound 3: Uses spectral rolloff (high-frequency energy), zero-crossing rate (noisiness), amplitude spectrum
        features = ['spectralRolloff', 'zcr', 'amplitudeSpectrum'];
    }

    // Initialize Meyda analyzer to process audio features
    meydaAnalyzer = Meyda.createMeydaAnalyzer({
        audioContext: getAudioContext(), // p5.js audio context
        source: sound, // Audio source
        bufferSize: 512, // Analysis buffer size
        featureExtractors: features, // Selected features
        callback: features => {
            // Store features and draw visualization
            lastFrame = features;
            drawVisualization(features);
        }
    });

    // Create UI buttons for playback control
    let playButton = createButton('Play/Pause');
    // Position button at top-left
    playButton.position(10, 10);
    // Bind togglePlay function to button click
    playButton.mousePressed(togglePlay);

    let nextButton = createButton('Next Sound');
    // Position next to play button
    nextButton.position(100, 10);
    // Bind nextSound function to button click
    nextButton.mousePressed(nextSound);
}

// Main draw loop: manages analyzer and visualization rendering
function draw() {
    // If playing, start analyzer to process audio features
    if (isPlaying && meydaAnalyzer) {
        meydaAnalyzer.start();
    // If paused and last frame exists, draw static visualization
    } else if (lastFrame) {
        drawVisualization(lastFrame);
    // Otherwise, clear canvas to black
    } else {
        background(0);
    }
}

// Render visualizations based on sound index and audio features
function drawVisualization(features) {
    if (currentSoundIndex === 0) {
        // Sound 1: Grid of rotating rectangles with orbiting circles
        // Reset transformation matrix for 2D-like rendering
        resetMatrix();
        // Translate for perspective in 3D space
        translate(0, -20, -500);

        // Extract audio features
        let rms = features.rms; // Amplitude (loudness)
        let centroid = features.spectralCentroid; // Frequency brightness
        let chroma = features.chroma; // Pitch class distribution
        // Calculate mean chroma for visual consistency
        let chromaMean = chroma.reduce((a, b) => a + b, 0) / chroma.length;

        // Map RMS to number of rectangles (10 to 50 based on loudness)
        let numRectangles = floor(map(rms, 0, 0.15, 10, 50));
        // Map RMS to rectangle size (20 to 60 pixels based on loudness)
        let rectSize = map(rms, 0, 0.15, 20, 60);
        // Map centroid to background hue (0 to 360 degrees based on frequency)
        let fillHue = map(centroid, 500, 1700, 0, 360);
        // Map chroma mean to border opacity (50 to 255 based on pitch strength)
        let borderOpacity = map(chromaMean, 0.2, 0.6, 50, 255);
        // Map chroma mean to orbiting circle speed (0.05 to 0.2 radians/frame)
        let orbitSpeed = map(chromaMean, 0.2, 0.6, 0.05, 0.2);

        // Set background color based on centroid (low saturation and brightness)
        background(fillHue, 20, 20);
        // Center coordinate system for grid
        translate(-width / 2, -height / 2);

        // Draw central rotating ellipse (size based on RMS)
        push();
        translate(width / 2, height / 2);
        // Rotate if playing for dynamic effect
        rotate(isPlaying ? frameCount * 0.01 : 0);
        // Set fill to complementary hue with partial opacity
        fill((fillHue + 180) % 360, 80, 100, 150);
        noStroke();
        // Ellipse size scales with RMS (50 to 150 pixels)
        ellipse(0, 0, map(rms, 0, 0.15, 50, 150));
        pop();

        // Arrange rectangles in a grid
        let cols = floor(sqrt(numRectangles));
        let rows = ceil(numRectangles / cols);
        let spacingX = width / (cols + 1);
        let spacingY = height / (rows + 1);
        for (let i = 0; i < numRectangles; i++) {
            let col = i % cols;
            let row = floor(i / cols);
            let x = (col + 1) * spacingX;
            let y = (row + 1) * spacingY;
            // Add noise-based offset for organic motion (active only when playing)
            let noiseOffset = isPlaying ? noise(x * 0.01, y * 0.01, frameCount * 0.01) * 10 - 5 : 0;
            x += noiseOffset;
            y += noiseOffset;
            push();
            translate(x, y);
            // Rotate rectangles based on chroma mean (-45 to 45 degrees)
            rotate(map(chromaMean, 0.2, 0.6, -PI / 4, PI / 4));
            // Fill with hue based on centroid
            fill(fillHue, 80, 100);
            // Stroke with complementary hue and chroma-based opacity
            stroke(fillHue + 180, 80, 100, borderOpacity);
            strokeWeight(3);
            // Draw rectangle with RMS-based size
            rect(0, 0, rectSize, rectSize);
            if (isPlaying) {
                // Draw orbiting circle around each rectangle
                let orbitRadius = map(chromaMean, 0.2, 0.6, 10, 30);
                let circleX = cos(frameCount * orbitSpeed) * orbitRadius;
                let circleY = sin(frameCount * orbitSpeed) * orbitRadius;
                fill((fillHue + 180) % 360, 80, 100, 150);
                noStroke();
                ellipse(circleX, circleY, 10, 10);
            }
            pop();
        }
    } else if (currentSoundIndex === 1) {
        // Sound 2: 3D grid with exploding sphere and glowing rings
        // Extract audio features with fallbacks for stability
        let rms = features.rms || 0.01; // Amplitude (loudness)
        let flatness = features.spectralFlatness || 1e-6; // Noisiness
        let chroma = features.chroma || Array(12).fill(0); // Pitch classes
        // Calculate mean chroma
        let chromaMean = chroma.reduce((a, b) => a + b, 0) / chroma.length;

        // Smooth features to reduce visual jitter
        smoothedEnergy = 0.9 * smoothedEnergy + 0.1 * rms; // Smooth RMS
        smoothedFlatness = 0.9 * smoothedFlatness + 0.1 * flatness; // Smooth flatness
        smoothedChromaMean = 0.9 * smoothedChromaMean + 0.1 * chromaMean; // Smooth chroma

        // Calculate build-up effect based on playback progress
        let timeProgress = isPlaying ? sound.currentTime() / sound.duration() : 0;
        let buildup = pow(timeProgress, 3); // Cubic curve for explosive growth
        // Map chroma mean to base hue (180 to 360 degrees)
        let hueBase = map(smoothedChromaMean, 0, 1, 180, 360);
        // Create pulsing effect for dynamic visuals
        let pulse = sin(frameCount * 0.05) * 0.5 + 1;

        // Reset transformation matrix
        resetMatrix();
        // Clear background to black
        background(0);
        // Translate for 3D perspective
        translate(-width / 2, -height / 2, -600);
        // Set ambient and directional lighting for 3D objects
        ambientLight(60);
        directionalLight(255, 255, 255, 0, 0, -1);

        // Draw reactive 3D grid
        push();
        translate(width / 2, height / 2, -200);
        let spacing = 60; // Grid spacing for performance
        for (let x = -width / 2; x <= width / 2; x += spacing) {
            for (let y = -height / 2; y <= height / 2; y += spacing) {
                let zx = x * 0.01;
                let zy = y * 0.01;
                // Z-position oscillates based on flatness (up to 30 pixels)
                let z = sin(zx + frameCount * 0.05) * sin(zy + frameCount * 0.05) * 30 * smoothedFlatness;
                push();
                translate(x, y, z);
                // Stroke hue varies by position and chroma
                stroke((hueBase + x * 0.1 + y * 0.1) % 360, 50, 50, 60);
                strokeWeight(0.8);
                noFill();
                // Box size scales with RMS (3 to 153 pixels)
                box(3 + smoothedEnergy * 150);
                pop();
            }
        }
        pop();

        // Draw exploding sphere
        push();
        // Sphere size scales with RMS and build-up (50 to 750 pixels)
        let sphereSize = map(smoothedEnergy, 0, 0.1, 50, 300) * (1 + buildup * 1.5);
        translate(width / 2, height / 2);
        // Rotate for dynamic 3D effect
        rotateY(frameCount * 0.01);
        rotateX(frameCount * 0.01);
        // Fill with pulsing hue based on chroma
        fill((hueBase + 30 * pulse) % 360, 100, 100, 180);
        noStroke();
        // Draw sphere with moderate detail for performance
        sphere(sphereSize, 32, 32);
        pop();

        // Draw glowing rings around sphere
        push();
        translate(width / 2, height / 2);
        for (let i = 0; i < 6; i++) {
            rotateZ(PI / 3); // Rotate each ring by 60 degrees
            // Ring opacity scales with RMS (20 to 50)
            stroke(hueBase, 80, 80, 20 + 30 * smoothedEnergy);
            noFill();
            // Ring size scales with sphere size
            ellipse(0, 0, sphereSize * 1.4 + i * 10);
        }
        pop();
    } else {
        // Sound 3: Flowing lines, sinusoidal waves, and sparkle particles
        // Smooth audio features
        smoothedRolloff = 0.9 * smoothedRolloff + 0.1 * (features.spectralRolloff || 0); // High-frequency energy
        smoothedZcr = 0.9 * smoothedZcr + 0.1 * (features.zcr || 0); // Noisiness

        // Calculate spectral centroid and amplitude energy from spectrum
        let ampSpectrum = features.amplitudeSpectrum || [];
        let freqSum = 0, ampSum = 0;
        for (let i = 0; i < ampSpectrum.length; i++) {
            freqSum += i * ampSpectrum[i];
            ampSum += ampSpectrum[i];
        }
        let centroid = freqSum / (ampSum || 1); // Frequency brightness
        let ampEnergy = ampSum / (ampSpectrum.length || 1); // Overall amplitude
        smoothedCentroid = 0.9 * smoothedCentroid + 0.1 * centroid;
        smoothedAmpEnergy = 0.9 * smoothedAmpEnergy + 0.1 * ampEnergy;

        // Map features to visual properties
        // Glow intensity based on amplitude (60 to 255)
        let glow = map(smoothedAmpEnergy, 0, 0.2, 60, 255);
        // Hue based on centroid (0 to 360 degrees)
        let hueVal = map(smoothedCentroid, 0, 512, 0, 360);
        // Background brightness based on ZCR (0 to 60)
        let bg = map(smoothedZcr, 0, 110, 0, 60);
        // Line stroke weight based on ZCR (0.5 to 3 pixels)
        let borderW = map(smoothedZcr, 0, 110, 0.5, 3);
        // Line height based on rolloff (20 to 160 pixels)
        let rolloffMapped = map(smoothedRolloff, 5835.29, 24094.12, 20, 160);
        // Wave amplitude based on amplitude energy (10 to 60 pixels)
        let waveAmp = map(smoothedAmpEnergy, 0, 0.2, 10, 60);
        // Wave frequency based on ZCR (0.01 to 0.1 radians/pixel)
        let waveFreq = map(smoothedZcr, 0, 110, 0.01, 0.1);

        // Set background with ZCR-based brightness
        background(bg, 30);

        // Draw top flowing lines
        push();
        translate(0, -height / 2 + 80, 0);
        // Stroke with centroid-based hue and amplitude-based glow
        stroke(hueVal, 80, 100, glow);
        // Stroke weight based on ZCR
        strokeWeight(borderW);
        noFill();
        let numLines = 6;
        for (let i = 0; i < numLines; i++) {
            beginShape();
            for (let x = -width / 2; x <= width / 2; x += 10) {
                // Y-position oscillates with rolloff-based height
                let y = sin(x * 0.01 + frameCount * 0.05) * rolloffMapped;
                // Z-position for subtle 3D effect
                let z = sin(x * 0.02 + i) * 20;
                vertex(x, y + i * 15, z);
            }
            endShape();
        }
        pop();

        // Draw bottom sinusoidal wave
        push();
        translate(-width / 2, height / 2 - 130, 0);
        // Stroke with centroid-based hue
        stroke(hueVal, 80, 100, 120);
        strokeWeight(1.5);
        noFill();
        beginShape();
        for (let x = 0; x <= width; x += 10) {
            // Y-position oscillates with amplitude and ZCR-based frequency
            let y = sin(x * waveFreq + frameCount * 0.05) * waveAmp;
            vertex(x, y);
        }
        endShape();
        pop();

        // Draw bottom dotted circle wave
        push();
        translate(-width / 2, height / 2 - 80, 0);
        noStroke();
        for (let x = 0; x <= width; x += 20) {
            // Y-position oscillates with amplitude-based height (4 to 20 pixels)
            let y = sin(x * 0.02 + frameCount * 0.05) * map(smoothedAmpEnergy, 0, 0.2, 4, 20);
            // Fill with centroid-based hue
            fill(hueVal, 90, 100, 180);
            // Circle size scales with amplitude (3 to 8 pixels)
            circle(x, y, map(smoothedAmpEnergy, 0, 0.2, 3, 8));
        }
        pop();

        // Draw reactive sparkle particles (spawn probability based on amplitude)
        if (isPlaying && random() < smoothedAmpEnergy * 0.5) {
            for (let i = 0; i < 2; i++) {
                let px = random(-width / 2, width / 2);
                let py = random(-height / 2, height / 2);
                push();
                translate(px, py);
                noStroke();
                // Fill with centroid-based hue
                fill(hueVal, 100, 100, 100);
                ellipse(0, 0, 3);
                pop();
            }
        }
    }
}

// Toggle play/pause state of the sound
function togglePlay() {
    if (!isPlaying) {
        // Start playback and reset last frame
        sound.play();
        isPlaying = true;
        lastFrame = null;
    } else {
        // Pause playback and stop analyzer
        sound.pause();
        isPlaying = false;
        meydaAnalyzer.stop();
    }
}

// Switch to the next sound and reinitialize analyzer
function nextSound() {
    // Stop current sound and analyzer
    sound.stop();
    isPlaying = false;
    meydaAnalyzer.stop();
    lastFrame = null;
    // Cycle to next sound in playlist
    currentSoundIndex = (currentSoundIndex + 1) % soundFiles.length;
    // Load new sound
    sound = loadSound(soundFiles[currentSoundIndex], () => {
        // Set end callback
        sound.onended(() => {
            isPlaying = false;
            meydaAnalyzer.stop();
            lastFrame = null;
        });
        // Select features for new sound
        let features = [];
        if (currentSoundIndex === 0) {
            features = ['rms', 'spectralCentroid', 'chroma'];
        } else if (currentSoundIndex === 1) {
            features = ['energy', 'spectralFlatness', 'chroma', 'rms'];
        } else {
            features = ['spectralRolloff', 'zcr', 'amplitudeSpectrum'];
        }
        // Reinitialize Meyda analyzer
        meydaAnalyzer = Meyda.createMeydaAnalyzer({
            audioContext: getAudioContext(),
            source: sound,
            bufferSize: 512,
            featureExtractors: features,
            callback: features => {
                lastFrame = features;
                drawVisualization(features);
            }
        });
    });
}