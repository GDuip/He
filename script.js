// script.js - Inspector Omega Version
document.addEventListener('DOMContentLoaded', () => {
  const App = {
    elements: { /* To be populated by querySelectorAll on init or individually */ },
    state: {
      currentTheme: localStorage.getItem('theme') || 'light',
      isSidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
      isMobileSidebarOpen: false,
      isFpsEstimating: false, fpsRafId: null, fpsFrames: [], fpsVisualizerFrames: Array(60).fill(0), fpsLastFrameTime: 0, fpsVisualizerCtx: null,
      vsyncTest: { rafId: null,isRunning: false },
      pixelTest: { overlayEl: null, isRunning: false, currentPattern: null },
      burnInSweeper: { intervalId: null, isRunning: false, overlayEl: null },
      mouseInspector: { samples: [], lastMoveTime: 0, pixelSumX: 0, pixelSumY: 0, isCalibrating: false },
      webUsb: { selectedDevice: null },
      webBle: { server: null, device: null, isScanning: false },
      webRtc: { pc1: null, pc2: null, dc1: null, statsInterval: null },
      reportingObserver: null,
      animationTest: { currentRafId: null, longTaskObserver: null },
      computePressure: { observer: null, lastState: 'nominal' },
      sensors: { active: {} /* e.g., { Accelerometer: sensorInstance } */ },
      shapeDetection: { videoEl: null, canvasEl: null, ctx: null, stream: null, rafId: null, detectors: {} },
      fileChecksum: { currentFile: null },
      tooltipTimeout: null, webGlContext: null,
    },

    // UTILITY FUNCTIONS (Enhanced)
    getEl: (id) => App.elements[id] || document.getElementById(id),
    setText: (elementOrId, value, { className = 'card-value', status = '', isCode = false, placeholder = false, isLoading = false } = {}) => {
        const el = (typeof elementOrId === 'string') ? App.getEl(elementOrId) : elementOrId;
        if (!el) { console.warn(`setText: Element not found for ID/ref: ${elementOrId}`); return; }
        let displayValue = (value === undefined || value === null || String(value).trim() === '') ? 'N/A' : String(value);
        el.innerHTML = ''; // Clear previous content, including spinners
        el.className = className;
        if (isLoading) {
            const textNode = document.createTextNode(displayValue + ' ');
            const spinner = document.createElement('span');
            spinner.className = 'loading-spinner';
            el.appendChild(textNode); el.appendChild(spinner);
        } else { el.textContent = displayValue; }
        if (isCode) el.classList.add('code-text');
        if (status) el.classList.add(`value-${status}`); else el.classList.remove('value-success', 'value-warning', 'value-error', 'value-neutral');
        if (placeholder) el.classList.add('placeholder'); else el.classList.remove('placeholder');
    },
    setHTML: (elementOrId, htmlContent, { className = 'card-value', status = '' } = {}) => { /* As before */ },
    setHTMLList: (containerOrId, itemsArray, itemClass = 'list-item', emptyMessage = 'No items found.', isLoading = false) => { /* As before, using App.setText for loading message */ },
    checkAPISupport: (condition, elementOrId, featureName, availabilityText = { supported: "Supported", notSupported: "Not Supported" }, isAvailableCheck = false) => { /* As before */ },
    handleErrorText: (elementOrId, message = 'Error or N/A', error = null) => {
        console.warn(`Error for ${typeof elementOrId === 'string' ? elementOrId : elementOrId.id}:`, message, error);
        App.setText(elementOrId, message, { status: 'error' });
    },
    setButtonLoadingState: (buttonOrId, isLoading, loadingText = "Loading", originalText = null) => {
        const btn = (typeof buttonOrId === 'string') ? App.getEl(buttonOrId) : buttonOrId;
        if (!btn) return;
        const btnTextSpan = btn.querySelector('.btn-text');
        if (isLoading) {
            if (!btn.hasAttribute('data-original-text') && btnTextSpan) { btn.setAttribute('data-original-text', btnTextSpan.textContent); }
            else if (!btn.hasAttribute('data-original-text')) { btn.setAttribute('data-original-text', btn.textContent.trim().split('\n')[0]); } // Fallback for buttons without .btn-text
            if (btnTextSpan) { btnTextSpan.textContent = loadingText; } else { btn.childNodes.forEach(node => { if(node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) node.nodeValue = loadingText; }); }
            btn.classList.add('loading'); btn.disabled = true;
        } else {
            const storedText = btn.getAttribute('data-original-text') || originalText;
            if (storedText) {
              if (btnTextSpan) { btnTextSpan.textContent = storedText; }
              else { btn.childNodes.forEach(node => { if(node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) node.nodeValue = storedText; });}
            }
            btn.classList.remove('loading'); btn.disabled = false; btn.removeAttribute('data-original-text');
        }
    },
    requestPermissionIfNeeded: async (permissionName, friendlyName, rationale = "") => {
        if (!navigator.permissions) return 'not-supported';
        try {
            const existing = await navigator.permissions.query({ name: permissionName });
            if (existing.state === 'granted') return 'granted';
            if (existing.state === 'denied') return 'denied';
            // If 'prompt', the actual API call will trigger it. For now, signal it might prompt.
            // For some APIs (like sensors), we might need to try creating an instance to trigger prompt.
            App.Tooltips.updateAndShow(document.body, `${friendlyName} requires permission. ${rationale} The browser may now ask.`, 3000);
            return 'prompt'; // Indicate that a prompt is likely
        } catch (e) {
            console.warn(`Permission query error for ${permissionName}:`, e);
            return 'error';
        }
    },

    // INITIALIZATION
    init() {
      // Cache all elements from HTML based on IDs
      const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
      allIds.forEach(id => { if(id) App.elements[id] = document.getElementById(id); });
      App.state.fpsLastFrameTime = performance.now(); // Initialize for FPS estimator

      this.Theme.init();
      this.Sidebar.init();
      this.Navigation.init();
      this.Tooltips.init();
      this.Reporting.init();

      this.DisplayVisuals.init();
      this.SystemOS.init();
      this.HardwareSensors.init();
      this.InputPeripherals.init();
      this.MediaCapturing.init();
      this.Connectivity.init();
      this.BrowserStorage.init();
      this.Performance.init();
      this.SecurityPermissions.init();
      this.AdvancedAPIs.init();
      this.AccessibilityTools.init();
      this.FileTools.init(); // Explicitly init new module

      if (App.elements.currentYear) App.elements.currentYear.textContent = new Date().getFullYear();
      console.log("Inspector Omega Initialized: Advanced diagnostics engaged.");
    },

    // --- MODULES ---
    Theme: { /* As before */
        init() { /*...*/ }, toggle() { /*...*/ }, updateIcon() { /*...*/ }
    },
    Sidebar: { /* As before, using App.elements.desktopToggleIconOpen/Closed */
        init() { /*...*/ }, updateDesktopToggleIcon() { /*...*/ }
    },
    Navigation: { /* As before */
        init() { /*...*/ }, navigateTo() { /*...*/ }
    },
    Tooltips: { /* As before */
        init() { /*...*/ }, show() { /*...*/ }, hide() { /*...*/ }, updateAndShow() { /*...*/ }
    },

    DisplayVisuals: {
      init() {
        this.populatePrimaryDisplayInfo();
        App.elements.startRefreshRateTestBtn?.addEventListener('click', () => this.estimateRefreshRate(false));
        App.elements.loadMultiScreenBtn?.addEventListener('click', () => this.getMultiScreenDetails());
        this.estimateRefreshRate(true);

        // Pixel Locator
        App.elements.pixelTestColorButtons?.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => this.startPixelTest(e.currentTarget.dataset.color || e.currentTarget.dataset.pattern));
        });
        App.elements.pixelTestOverlay?.addEventListener('click', () => this.stopPixelTest());
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && App.state.pixelTest.isRunning) this.stopPixelTest(); });

        // Pixel Patterns
        App.elements.pixelPatternSelect?.addEventListener('change', (e) => this.drawPixelPattern(e.target.value));
        this.drawPixelPattern(App.elements.pixelPatternSelect?.value);

        // VSync Test
        App.elements.startVsyncTestBtn?.addEventListener('click', () => this.runVSyncTest());
        
        // Burn-in Sweeper
        App.elements.startBurnInSweeperBtn?.addEventListener('click', () => this.runBurnInSweeper());
      },
      populateCard(gridId, label, valueId, valueText, opts = {}) {
          const grid = App.getEl(gridId);
          if (!grid) return;
          let card = App.getEl(valueId)?.closest('.info-card');
          if (!card) {
              card = document.createElement('div');
              card.className = 'info-card';
              card.innerHTML = `<div class="card-label">${label}</div><div id="${valueId}" class="card-value"></div>`;
              grid.appendChild(card);
          }
          App.setText(valueId, valueText, opts);
      },
      populatePrimaryDisplayInfo(screenObj = screen, gridId = 'primaryDisplayInfoGrid', prefix = '') {
        const s = screenObj;
        const isPrimary = gridId === 'primaryDisplayInfoGrid';

        this.populateCard(gridId, `${prefix}Resolution`, `${prefix}currentResolution`, `${s.width} x ${s.height}`);
        this.populateCard(gridId, `${prefix}Viewport`, `${prefix}availableResolution`, isPrimary ? `${window.innerWidth} x ${window.innerHeight}` : `${s.availWidth} x ${s.availHeight}`);
        this.populateCard(gridId, `${prefix}Color Depth`, `${prefix}colorDepthVal`, `${s.colorDepth} bits`);
        this.populateCard(gridId, `${prefix}Pixel Ratio`, `${prefix}pixelRatioVal`, (s.devicePixelRatio || window.devicePixelRatio) || 'N/A');
        
        if (s.orientation) {
            this.populateCard(gridId, `${prefix}Orientation`, `${prefix}orientationVal`, s.orientation.type);
            if (isPrimary) s.orientation.onchange = () => this.populateCard(gridId, 'Orientation', 'orientationVal', s.orientation.type);
        } else { this.populateCard(gridId, `${prefix}Orientation`, `${prefix}orientationVal`, 'N/A', {status: 'warning'}); }

        if (isPrimary) {
            const touchSupport = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
            this.populateCard(gridId, 'Touch Support', 'touchSupportVal', touchSupport ? `Yes (${navigator.maxTouchPoints || 'Unknown'} points)` : 'No', { status: touchSupport ? 'success' : 'neutral' });
            this.checkPrimaryDisplayAdvanced();
        }
      },
      checkPrimaryDisplayAdvanced() { // For HDR, Gamut on primary
        const checkMediaQuery = (mq, id, successMsg, failMsg, standardMsg) => {
          if (window.matchMedia) {
            let result = failMsg, sClass = 'neutral';
            if (window.matchMedia(`(${mq}: high)`).matches || window.matchMedia(`(${mq}: p3)`).matches || window.matchMedia(`(${mq}: rec2020)`).matches) {
                result = `${successMsg} (${window.matchMedia(`(${mq}: p3)`).matches ? 'P3' : window.matchMedia(`(${mq}: rec2020)`).matches ? 'Rec.2020' : 'High'})`; sClass = 'success';
            } else if (window.matchMedia(`(${mq}: standard)`).matches || window.matchMedia(`(${mq}: srgb)`).matches) { result = standardMsg; sClass = 'neutral'; }
            this.populateCard('primaryDisplayInfoGrid', mq.includes('range') ? 'HDR (CSS)' : 'Gamut (CSS)', id, result, { status: sClass });
          } else this.populateCard('primaryDisplayInfoGrid', mq.includes('range') ? 'HDR (CSS)' : 'Gamut (CSS)', id, 'Media Query API N/A', {status:'warning'});
        };
        checkMediaQuery('dynamic-range', 'hdrStatusVal', 'HDR Capable', 'HDR Not Detected (SDR)', 'SDR (Standard)');
        checkMediaQuery('color-gamut', 'colorGamutStatusVal', 'Wide Gamut', 'Color Gamut Undetermined', 'Likely sRGB');
      },
      async getMultiScreenDetails() { /* As before, but using populateCard within loops for each screen's details */
          const container = App.elements.multiScreenDetailsContainer;
          const btn = App.elements.loadMultiScreenBtn;
          if (!container || !btn) return;
          App.setButtonLoadingState(btn, true);
          container.style.display = 'grid';
          container.innerHTML = '<div class="info-card full-span placeholder-card"><div id="multiScreenStatus" class="card-value">Querying...</div></div>';
          App.setText('multiScreenStatus', 'Querying extended screen details...', {isLoading: true});
          try {
            const screenDetails = await (window.getScreenDetails ? window.getScreenDetails() : (navigator.windowManagement ? navigator.windowManagement.getScreenDetails() : null));
            if (!screenDetails || !screenDetails.screens || screenDetails.screens.length === 0) {
                App.setText('multiScreenStatus', 'Screen Details API not supported or no extended screens found.', {status: 'warning'}); return;
            }
            container.innerHTML = ''; // Clear placeholder
            screenDetails.screens.forEach((s, i) => {
                const screenGridId = `multiScreenGrid_${i}`;
                const screenCard = document.createElement('div');
                screenCard.className = 'info-card full-span'; // Each screen gets a full card
                screenCard.innerHTML = `
                    <h3>Screen ${i + 1} ${s.isPrimary ? '<span class="value-success">(Primary)</span>' : ''} ${s.isInternal ? '(Internal)' : ''} ${s.isExternal ? '(External)' : ''}</h3>
                    <p class="card-description code-text" style="font-size:0.8em; margin-bottom:0.5rem;">Label: ${s.label || 'N/A'} | ID: ${s.id || 'N/A'}</p>
                    <div class="info-grid" id="${screenGridId}"></div>`; // Nested grid for this screen's details
                container.appendChild(screenCard);
                this.populatePrimaryDisplayInfo(s, screenGridId, `s${i}_`); // Pass prefix
            });
            const primary = screenDetails.screens.find(s => s.isPrimary) || screenDetails.currentScreen || screen;
            this.populatePrimaryDisplayInfo(primary); // Update main display info
            screenDetails.onscreenschange = () => this.getMultiScreenDetails(); // Re-query on change
            if(screenDetails.oncurrentscreenchange !== undefined) screenDetails.oncurrentscreenchange = () => this.getMultiScreenDetails();
          } catch (e) { App.handleErrorText('multiScreenStatus', `Multi-screen error: ${e.message}`, e);
          } finally { App.setButtonLoadingState(btn, false); }
      },
      estimateRefreshRate(quickEstimate = false) { /* As before, ensuring App.state.fpsVisualizerCtx is used */ },
      drawFpsVisualizer() { /* As before */ },
      startPixelTest(type) { /* Uses App.state.pixelTest.overlayEl, toggles fullscreen */
        App.state.pixelTest.overlayEl = App.state.pixelTest.overlayEl || App.getEl('pixelTestOverlay');
        if (!App.state.pixelTest.overlayEl) return;
        App.state.pixelTest.isRunning = true; App.state.pixelTest.currentPattern = type;
        App.state.pixelTest.overlayEl.className = 'pixel-test-active';
        // ... (set background color/pattern class) ... (from previous response)
        App.state.pixelTest.overlayEl.style.display = 'block';
        try { App.state.pixelTest.overlayEl.requestFullscreen?.(); } catch(e){}
      },
      stopPixelTest() { /* Clears fullscreen and hides overlay */
        if (!App.state.pixelTest.isRunning || !App.state.pixelTest.overlayEl) return;
        App.state.pixelTest.isRunning = false; App.state.pixelTest.overlayEl.style.display = 'none';
        if (document.fullscreenElement) document.exitFullscreen?.();
      },
      drawPixelPattern(patternType) { /* As before */ },
      runVSyncTest() { /* As before, using App.state.vsyncTest */ },
      runBurnInSweeper() { /* As before, using App.state.burnInSweeper */ }
    },

    SystemOS: { /* As before, ensure elements are populated into their grid (e.g., osInfoGrid) using DisplayVisuals.populateCard or similar helper */
        init() {
            this.populateOSInfo(); this.getBatteryInfo();
            App.checkAPISupport('geolocation' in navigator, App.getEl('geolocationApiVal'), 'Geolocation', {supported: "Available", notSupported: "Not Available"}, true);
            App.elements.checkGeolocationBtn?.addEventListener('click', () => this.getGeolocation());
        },
        populateOSInfo() { /* ... use DisplayVisuals.populateCard for each item in osInfoGrid ... */ },
        async getBatteryInfo() { /* ... as before, update elements in batteryInfoGrid ... */},
        async getGeolocation() { /* ... as before, update elements in geolocationInfoGrid ... */ }
    },

    HardwareSensors: { /* Expanded for Compute Pressure and live sensor data */
        init() {
            App.DisplayVisuals.populateCard('coreHardwareGrid', 'CPU Cores', 'cpuCoresVal', navigator.hardwareConcurrency || 'N/A');
            // ... other core hardware ...
            App.elements.loadWebGLExtensionsBtn?.addEventListener('click', () => this.listWebGLExtensions());
            this.getWebGLContextAndInfo(); this.checkEMEHDCP();

            App.elements.checkSensorApisBtn?.addEventListener('click', () => this.checkAllSensors(true)); // true to force re-check/activation
            this.checkAllSensors(false); // Initial availability check

            App.checkAPISupport('ComputePressureObserver' in window, App.getEl('computePressureApiVal'), 'Compute Pressure API');
            App.elements.startComputePressureObs?.addEventListener('click', () => this.observeComputePressure());
        },
        getWebGLContextAndInfo() { /* ... */ }, listWebGLExtensions() { /* ... */ }, async checkEMEHDCP() { /* ... */ },
        checkSensorAvailability(sensorName, elementId) { /* Checks if sensor class exists, updates elementId */
            const isSupported = sensorName in window;
            App.checkAPISupport(isSupported, App.getEl(elementId), sensorName.replace('Sensor',' Sensor'));
            return isSupported;
        },
        async toggleSensor(sensorName, sensorClass, readingElId, statusElId) { /* Activate/deactivate individual sensor, display readings */
            const statusEl = App.getEl(statusElId);
            const readingEl = App.getEl(readingElId);
            if (!statusEl || !readingEl) return;

            if (App.state.sensors.active[sensorName]) { // Sensor is active, stop it
                App.state.sensors.active[sensorName].stop();
                delete App.state.sensors.active[sensorName];
                App.setText(statusEl, 'Supported (Click to Activate)', {status: 'success'});
                readingEl.textContent = '-';
                return;
            }
            if (!(sensorClass in window)) { App.handleErrorText(statusEl, 'Not Supported'); return; }
            
            try {
                await App.requestPermissionIfNeeded(sensorName.toLowerCase().replace('sensor',''), sensorName); // e.g. 'accelerometer'
                const sensor = new window[sensorClass]({ frequency: 10 }); // Adjust frequency as needed
                sensor.onreading = () => {
                    let readingText = '';
                    if (sensor.illuminance !== undefined) readingText = `${sensor.illuminance.toFixed(2)} lux`; // AmbientLight
                    else if (sensor.x !== undefined) readingText = `X:${sensor.x.toFixed(2)}, Y:${sensor.y.toFixed(2)}, Z:${sensor.z.toFixed(2)}`; // Accel, Gyro, Magneto
                    readingEl.textContent = readingText;
                    App.setText(statusEl, 'Active (Click to Deactivate)', {status:'success'});
                };
                sensor.onerror = (event) => {
                    App.handleErrorText(statusEl, `Sensor Error: ${event.error.name}`, event.error);
                    readingEl.textContent = 'Error';
                    if (App.state.sensors.active[sensorName]) delete App.state.sensors.active[sensorName];
                };
                sensor.start();
                App.state.sensors.active[sensorName] = sensor;
                App.setText(statusEl, 'Activating...', {isLoading:true});
            } catch (e) { App.handleErrorText(statusEl, `Failed to start ${sensorName}: ${e.message}`, e); }
        },
        checkAllSensors(activateOnClick = false) { /* Loop through sensors, call checkSensorAvailability. If activateOnClick, setup toggleSensor on click of statusEl */
            const sensorsToTest = [
                { name: 'AmbientLightSensor', statusId: 'ambientLightSensorVal', readingId: 'ambientLightReading' },
                { name: 'Accelerometer', statusId: 'accelerometerVal', readingId: 'accelerometerReading' },
                { name: 'Gyroscope', statusId: 'gyroscopeVal', readingId: 'gyroscopeReading' },
                { name: 'Magnetometer', statusId: 'magnetometerVal', readingId: 'magnetometerReading' },
            ];
            sensorsToTest.forEach(s => {
                const isSupported = this.checkSensorAvailability(s.name, s.statusId);
                const statusEl = App.getEl(s.statusId);
                if (isSupported && statusEl) {
                    statusEl.style.cursor = 'pointer';
                    statusEl.title = `Click to toggle ${s.name} activation`;
                    statusEl.onclick = () => this.toggleSensor(s.name, s.name, s.readingId, s.statusId);
                    if (activateOnClick === false) App.setText(statusEl, 'Supported (Click to Activate)', {status:'success'}); // Initial text
                }
            });
        },
        observeComputePressure() { /* ComputePressureObserver logic */
            const statusEl = App.getEl('computePressureApiVal');
            const stateEl = App.getEl('computePressureState');
            if (!('ComputePressureObserver' in window)) { App.handleErrorText(statusEl, 'Not Supported'); return; }
            if (App.state.computePressure.observer) { App.state.computePressure.observer.unobserve(); App.state.computePressure.observer = null; App.setText(statusEl, 'Observer Stopped'); return;}
            try {
                App.state.computePressure.observer = new ComputePressureObserver(
                    (update) => { App.state.computePressure.lastState = update[0].state; stateEl.textContent = `State: ${update[0].state}`; },
                    { cpuUtilizationThresholds: [0.5, 0.75, 0.9], cpuSpeedThresholds: [0.5, 0.75, 0.9] } // Example thresholds
                );
                App.state.computePressure.observer.observe();
                App.setText(statusEl, 'Observer Active', { status: 'success' });
                stateEl.textContent = 'State: nominal (Initial)';
                App.getEl('startComputePressureObs').textContent = 'Stop Observing';
            } catch (e) { App.handleErrorText(statusEl, `Error: ${e.message}`, e); App.getEl('startComputePressureObs').textContent = 'Observe';}
        }
    },

    InputPeripherals: { /* Mouse, Keyboard, WebUSB, WebBluetooth logic. Populate into their respective grids. */
        init() {
            this.initMouseInspector(); this.initKeyboardInspector(); this.initWebUSB(); this.initWebBluetooth();
        },
        initMouseInspector() { /* ... */}, handleMouseMove() {/* ... */}, calibrateMouseDpi() {/* ... */},
        initKeyboardInspector() { /* ... */}, logKeyEvent() {/* ... */},
        initWebUSB() { /* ... */}, async scanWebUSB() { /* ... */},
        initWebBluetooth() { /* ... */}, async scanBLE() { /* ... */}
    },

    MediaCapturing: { /* Codecs, DRM, Speech, Screen Recording, Shape Detection. Populate into grids. */
        init() {
            // ... init for existing media tools ...
            App.checkAPISupport(!!(window.BarcodeDetector || window.FaceDetector || window.TextDetector), App.getEl('shapeDetectionApiStatus'), 'Shape Detection API');
            App.elements.startShapeDetectionBtn?.addEventListener('click', () => this.toggleShapeDetection());
        },
        // ... existing codec/DRM/speech/screen recording checks ...
        async toggleShapeDetection() { /* getUserMedia, setup detectors, draw on canvas */
            const btn = App.getEl('startShapeDetectionBtn');
            const video = App.getEl('shapeDetectionVideo');
            const canvas = App.getEl('shapeDetectionCanvas');
            const placeholder = App.getEl('shapeDetectionPlaceholder');
            if (!video || !canvas || !btn || !placeholder) return;

            if (App.state.shapeDetection.isRunning) { // Stop
                if (App.state.shapeDetection.stream) { App.state.shapeDetection.stream.getTracks().forEach(track => track.stop()); }
                if (App.state.shapeDetection.rafId) cancelAnimationFrame(App.state.shapeDetection.rafId);
                App.state.shapeDetection.isRunning = false; App.state.shapeDetection.stream = null;
                video.style.display = 'none'; canvas.style.display = 'none'; placeholder.style.display = 'flex';
                App.setButtonLoadingState(btn, false, "Start Camera & Detect Shapes");
                return;
            }

            App.setButtonLoadingState(btn, true, "Starting...");
            try {
                App.state.shapeDetection.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
                video.srcObject = App.state.shapeDetection.stream;
                await video.play();
                video.style.display = 'block'; canvas.style.display = 'block'; placeholder.style.display = 'none';
                canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                App.state.shapeDetection.ctx = canvas.getContext('2d');
                App.state.shapeDetection.isRunning = true;
                App.setButtonLoadingState(btn, false, "Stop Camera & Detect");
                
                // Init detectors (example for Barcode)
                if (window.BarcodeDetector && App.getEl('detectBarcodes').checked && !App.state.shapeDetection.detectors.barcode) {
                    App.state.shapeDetection.detectors.barcode = new BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128'] }); // Add more formats
                }
                // ... init FaceDetector, TextDetector similarly ...

                this.detectShapesLoop();
            } catch (err) { App.handleErrorText(App.getEl('shapeDetectionApiStatus'), `Camera/Shape Error: ${err.message}`, err); App.setButtonLoadingState(btn, false, "Start Camera & Detect Shapes"); }
        },
        async detectShapesLoop() { /* rAF loop to draw video, run detectors, draw bounding boxes */
            if (!App.state.shapeDetection.isRunning) return;
            const { videoEl, canvasEl, ctx, detectors } = App.state.shapeDetection;
            if (!videoEl || !canvasEl || !ctx ) return;
            ctx.clearRect(0,0, canvasEl.width, canvasEl.height); // Clear previous frame
            // ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height); // Draw video frame if needed, or just draw detections

            if (detectors.barcode && App.getEl('detectBarcodes').checked) {
                try {
                    const barcodes = await detectors.barcode.detect(videoEl);
                    barcodes.forEach(barcode => {
                        ctx.strokeStyle = 'lime'; ctx.lineWidth = 2;
                        ctx.strokeRect(barcode.boundingBox.x, barcode.boundingBox.y, barcode.boundingBox.width, barcode.boundingBox.height);
                        ctx.fillStyle = 'lime'; ctx.fillText(barcode.rawValue, barcode.boundingBox.x, barcode.boundingBox.y - 5);
                    });
                } catch (e) { console.warn("Barcode detection error:", e); }
            }
            // ... FaceDetector, TextDetector logic ...
            App.state.shapeDetection.rafId = requestAnimationFrame(() => this.detectShapesLoop());
        }
    },

    Connectivity: { /* WebRTC, Reporting API logic. Populate into grids. */
        init() { /* ... */ }, async runWebRtcLoopbackTest() { /* ... */ }, startReportingObserver() { /* ... */ }
    },
    BrowserStorage: { /* As before */
        init() { /* ... */ }, getBrowserDetails() { /* ... */ }, inspectStorage() { /* ... */ }, async testNotificationAPI() { /* ... */ }, async testClipboardAPI() { /* ... */ }
    },
    Performance: { /* Jank Busters logic. Populate into grids. */
        init() { /* ... */ }, runAnimationTest() { /* Uses App.state.animationTest and PerformanceLongTaskTiming */ }
    },
    SecurityPermissions: { /* Permissions API dashboard. Populate into grid. */
        init() { /* ... */ }, async loadPermissionsDashboard() { /* ... */ }
    },
    AdvancedAPIs: { /* WebNN logic. Populate into grid. */
        init() { /* ... */ }, checkFontAccessAPI() { /* ... */ }, async listLocalFonts() { /* ... */ },
        async checkWebNN() {
            const statusEl = App.getEl('webNnApiStatus');
            const deviceEl = App.getEl('webNnDevicePreference');
            if (!statusEl || !deviceEl) return;
            App.setButtonLoadingState(App.getEl('checkWebNnBtn'), true);
            if (!navigator.ml) { App.handleErrorText(statusEl, 'WebNN API (navigator.ml) Not Supported'); App.setButtonLoadingState(App.getEl('checkWebNnBtn'), false); return; }
            try {
                App.setText(statusEl, 'API Present. Checking context...', {status:'success', isLoading:true});
                const mlContext = await navigator.ml.createContext({powerPreference: 'high-performance', deviceType: 'gpu'}); // Try GPU first
                App.setText(statusEl, `Context Created (Device: ${mlContext.deviceType || 'unknown'})`, {status:'success'});
                App.setText(deviceEl, `Preferred: GPU, Actual: ${mlContext.deviceType}`);
            } catch (err) { App.handleErrorText(statusEl, `WebNN Error: ${err.message}`, err); App.setText(deviceEl, 'Error or N/A');
            } finally { App.setButtonLoadingState(App.getEl('checkWebNnBtn'), false); }
        }
    },
    AccessibilityTools: { /* CVD Simulator logic. AOM if viable. Populate into grid. */
        init() { /* ... */ }, applyCvdFilter(filterName) { /* Applies class to body */
            const bodyClassList = document.body.classList;
            bodyClassList.forEach(cls => { if(cls.startsWith('cvd-filter-')) bodyClassList.remove(cls); }); // Clear previous
            if (filterName !== 'none') {
                document.body.classList.add('cvd-filter-active');
                document.body.style.setProperty('--cvd-filter-value', `url(#${filterName})`);
            } else {
                document.body.classList.remove('cvd-filter-active');
                document.body.style.removeProperty('--cvd-filter-value');
            }
        }
    },
    FileTools: { /* File Checksum logic. Populate into grid. */
        init() { /* ... */ }, async handleFileForChecksum(file) { /* ... as before, update elements in fileChecksumGrid ... */ }
    },

    Reporting: { /* Heavily updated to gather data from all new elements & states */
        init() { App.elements.copyReportBtn?.addEventListener('click', () => this.copyReport()); },
        async copyReport() {
            App.setButtonLoadingState(App.elements.copyReportBtn, true, "Gathering...");
            let report = `Inspector Omega - Diagnostic Report\nGenerated: ${new Date().toLocaleString()}\n`;
            report += "============================================\n\n";
            
            App.elements.navLinks.forEach(link => {
                const panelId = link.dataset.target;
                const panel = App.getEl(panelId);
                if (!panel) return;

                const panelTitle = link.querySelector('.link-text')?.textContent.trim() || panelId.replace('-panel','').toUpperCase();
                report += `--- ${panelTitle} SECTION ---\n`;

                panel.querySelectorAll('.info-grid').forEach(grid => {
                    grid.querySelectorAll(':scope > .info-card:not(.placeholder-card)').forEach(card => {
                        const labelEl = card.querySelector('.card-label');
                        const valueEl = card.querySelector('.card-value');
                        const descEl = card.querySelector('.card-description');
                        const smallValueEl = card.querySelector('.card-value-small'); // For sensor readings etc.

                        if (labelEl) report += `  ${labelEl.textContent.trim()}: `;
                        if (valueEl) {
                            let valueText = valueEl.textContent.trim().replace(/\s*Loading\.\.\..*/, '').trim(); // Clean loading text
                            if (valueText && valueText !== '-' && valueText !== 'N/A') {
                                if (valueEl.classList.contains('code-text')) report += `\n    ${valueText.split('\n').map(line => line.trim()).join('\n    ')}`;
                                else report += valueText;
                            }
                        }
                        if (smallValueEl && smallValueEl.textContent.trim() && smallValueEl.textContent.trim() !== '-') {
                            report += ` (${smallValueEl.textContent.trim()})`;
                        }
                        report += '\n';
                        if (descEl && descEl.textContent.trim()) report += `    (${descEl.textContent.trim().replace(/\s\s+/g, ' ')})\n`;
                        
                        const listContainer = card.querySelector('.list-display-container');
                        if (listContainer) {
                            listContainer.querySelectorAll('.list-item:not(.placeholder)').forEach(item => {
                                let itemText = item.innerHTML.replace(/<[^>]*>/g, " ").replace(/\s\s+/g, ' ').trim();
                                if (itemText) report += `    - ${itemText}\n`;
                            });
                        }
                    });
                });
                report += "\n";
            });
            // ... (similar logic for other complex data structures if not in cards) ...
            report += "============================================\n";
            report += "/!\\ Accuracy based on Browser APIs. Direct hardware access is NOT possible.\n";
            try {
                await navigator.clipboard.writeText(report);
                App.Tooltips.updateAndShow(App.elements.copyReportBtn, "Report Copied!");
            } catch (e) { console.error('Failed to copy report:', e); App.Tooltips.updateAndShow(App.elements.copyReportBtn, "Copy Failed! (See Console)"); console.log("--- REPORT --- \n", report);
            } finally { App.setButtonLoadingState(App.elements.copyReportBtn, false, "", "Copy Report"); }
        }
    }
  };

  App.init();
  window.InspectorApp = App; // For easier debugging
});
