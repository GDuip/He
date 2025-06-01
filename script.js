// script.js - Omega Version (Conceptual Structure & Key Implementations)
document.addEventListener('DOMContentLoaded', () => {
  const App = {
    // elements: { ... extensively expanded with new IDs ... },
    // state: { ... expanded with states for new tools ... },
    // Utility Functions (setText, setButtonLoadingState etc. as before, possibly refined)

    init() {
      // ... existing init logic ...
      // Initialize new modules/sections
      this.VisualTests.init();
      this.InputPeripherals.init();
      this.AdvancedConnectivity.init();
      this.AnimationPerformance.init();
      this.SecurityPermissions.init();
      this.AccessibilityTools.init();
      // ... ensure all event listeners for new buttons are set up ...
      console.log("Inspector Omega Initialized: Advanced diagnostics engaged.");
    },

    // --- Existing Modules (Refined & Expanded) ---
    // Display: { ... getMultiScreenDetails enhanced ... },
    // SystemOS: { ... },
    // HardwareSensors: { ... expanded with Compute Pressure, more sensor details ... },
    // MediaCapturing: { ... expanded with Shape Detection ... },
    // Connectivity: { ... },
    // BrowserStorage: { ... },
    // Performance: { ... },
    // AdvancedAPIs: { ... expanded with WebNN, File Checksum ... },
    // Reporting: { ... heavily updated to gather data from new tools ... },

    // --- NEW Modules for Advanced Tools ---
    VisualTests: {
      init() {
        // Pixel Locator
        App.elements.primaryDisplayInfoGrid.querySelectorAll('.action-btn-sm[data-color], .action-btn-sm[data-pattern]').forEach(btn => {
            btn.addEventListener('click', (e) => this.startPixelTest(e.currentTarget.dataset.color || e.currentTarget.dataset.pattern));
        });
        App.elements.pixelTestOverlay?.addEventListener('click', () => this.stopPixelTest());
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.stopPixelTest(); });

        // Pixel Patterns
        App.elements.pixelPatternSelect?.addEventListener('change', (e) => this.drawPixelPattern(e.target.value));
        this.drawPixelPattern(App.elements.pixelPatternSelect?.value);

        // VSync Test
        App.elements.startVsyncTestBtn?.addEventListener('click', () => this.runVSyncTest());
        
        // Burn-in Sweeper
        App.elements.startBurnInSweeperBtn?.addEventListener('click', () => this.runBurnInSweeper());
      },
      startPixelTest(type) {
        const overlay = App.elements.pixelTestOverlay;
        if (!overlay) return;
        overlay.className = ''; // Reset classes
        if (['black', 'white', 'red', 'green', 'blue'].includes(type)) {
            overlay.style.backgroundColor = type;
            overlay.style.backgroundImage = 'none';
        } else if (type === 'checker') {
            overlay.style.backgroundColor = 'transparent'; // Or a base for checker
            overlay.classList.add('checker'); // Uses CSS for checker pattern
        }
        overlay.style.display = 'block';
        document.body.requestFullscreen?.catch(err => console.warn("Fullscreen failed:", err));
      },
      stopPixelTest() {
        const overlay = App.elements.pixelTestOverlay;
        if (overlay && overlay.style.display === 'block') {
            overlay.style.display = 'none';
            if (document.fullscreenElement) document.exitFullscreen?.();
        }
      },
      drawPixelPattern(patternType) {
        const canvas = App.getEl('pixelPatternCanvas'); // Ensure this ID exists in HTML
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = 300; // Fixed size for demo
        const h = canvas.height = 150;
        ctx.clearRect(0, 0, w, h);
        // Example: RGB Stripes
        if (patternType === 'rgb_stripes') {
            for (let x = 0; x < w; x++) {
                if (x % 3 === 0) ctx.fillStyle = 'red';
                else if (x % 3 === 1) ctx.fillStyle = 'lime'; // Use lime for pure green
                else ctx.fillStyle = 'blue';
                ctx.fillRect(x, 0, 1, h);
            }
        } else if (patternType === 'inversion_test_1') { // Common 2x2 checker for inversion
             for (let y = 0; y < h; y += 2) {
                for (let x = 0; x < w; x += 2) {
                    ctx.fillStyle = ((x/2 + y/2) % 2 === 0) ? '#555555' : '#AAAAAA'; // Grey checker
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }
        // ... other patterns ...
      },
      runVSyncTest() { /* Implementation for requestAnimationFrame based visual bar movement, tear line */
          const canvas = App.getEl('vsyncCanvas');
          const resultsEl = App.getEl('vsyncTestResults');
          if (!canvas || !resultsEl) return;
          const ctx = canvas.getContext('2d');
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
          let x = 0;
          let lastTime = performance.now();
          let frameCount = 0;
          let METER_BARS = 10; //for tearing line test
          resultsEl.textContent = "Running... Observe for smoothness/tearing.";

          let rafId;
          function animateVSync(time) {
              const deltaTime = time - lastTime;
              lastTime = time;
              frameCount++;

              ctx.clearRect(0,0,canvas.width, canvas.height);
              
              // Simple moving bar for judder
              ctx.fillStyle = 'orange';
              ctx.fillRect(x, canvas.height / 2 - 15, 50, 30);
              x = (x + 5 * (deltaTime / (1000/60))) % (canvas.width - 50); // Move 5px per 60hz frame equiv

              // Tearing line chaser (simplified)
              let bar_width = Math.ceil(canvas.width / METER_BARS);
              for (let i = 0; i < METER_BARS; i++) {
                  ctx.fillStyle = (i % 2 == 0) ? '#FFF' : '#000';
                  if (i == (frameCount % METER_BARS)) { // Highlight current bar
                      ctx.fillStyle = (i % 2 == 0) ? 'lime' : 'green';
                  }
                  ctx.fillRect(i * bar_width, 0, bar_width, canvas.height / 4);
              }
              
              // rAF timing indicator
              ctx.fillStyle = 'green';
              ctx.fillRect(0, canvas.height - 10, canvas.width * ( (time % 1000) / 1000), 5);


              rafId = requestAnimationFrame(animateVSync);
          }
          if(this.vsyncRafId) cancelAnimationFrame(this.vsyncRafId);
          this.vsyncRafId = requestAnimationFrame(animateVSync);
          setTimeout(() => { // Stop test after a while
              cancelAnimationFrame(this.vsyncRafId);
              this.vsyncRafId = null;
              resultsEl.textContent = "Test complete. Assess visual smoothness.";
          }, 10000); // Run for 10 seconds
      },
      runBurnInSweeper() { /* Fullscreen color/pattern cycling logic */ 
        const overlay = App.elements.pixelTestOverlay;
        if (!overlay) return;
        App.setText(App.elements.startBurnInSweeperBtn, 'Sweeper Running (ESC to Stop)', {isLoading:true});
        overlay.style.display = 'block';
        document.body.requestFullscreen?.();
        
        const colors = ['red', 'lime', 'blue', 'white', 'black'];
        let colorIndex = 0;
        let patternType = 'color'; // 'color', 'inverseHorizontal', 'inverseVertical'

        this.sweeperInterval = setInterval(() => {
            if (patternType === 'color') {
                overlay.style.backgroundColor = colors[colorIndex % colors.length];
                overlay.style.backgroundImage = 'none';
                colorIndex++;
                if (colorIndex % colors.length === 0) patternType = 'inverseHorizontal';
            } else if (patternType === 'inverseHorizontal') {
                overlay.style.backgroundColor = 'transparent';
                overlay.style.backgroundImage = `linear-gradient(to right, ${colors[colorIndex % colors.length]}, ${colors[(colorIndex+1) % colors.length]})`;
                patternType = 'inverseVertical';
            } else { // inverseVertical
                overlay.style.backgroundColor = 'transparent';
                overlay.style.backgroundImage = `linear-gradient(to bottom, ${colors[colorIndex % colors.length]}, ${colors[(colorIndex+1) % colors.length]})`;
                patternType = 'color'; // Cycle back
                colorIndex++; 
            }
        }, 2000); // Change every 2 seconds

        const stopSweeper = () => {
            clearInterval(this.sweeperInterval);
            this.sweeperInterval = null;
            if (overlay.style.display === 'block') {
                overlay.style.display = 'none';
                if (document.fullscreenElement) document.exitFullscreen?.();
            }
            App.setButtonLoadingState(App.elements.startBurnInSweeperBtn, false);
            App.setText(App.elements.startBurnInSweeperBtn, 'Start Sweeper'); // Reset button text
            document.removeEventListener('keydown', escListener);
        };
        const escListener = (e) => { if (e.key === 'Escape') stopSweeper(); };
        document.addEventListener('keydown', escListener);
        overlay.onclick = stopSweeper; // Also allow click to stop
      },
    },

    InputPeripherals: {
      init() {
        // Mouse Inspector
        App.elements.mouseMovementArea?.addEventListener('mousemove', this.handleMouseMove.bind(this));
        App.elements.calibrateMouseDpiBtn?.addEventListener('click', this.calibrateMouseDpi.bind(this));
        this.mouseSamples = []; this.lastMouseMoveTime = 0; this.pixelSumX = 0;

        // Keyboard Inspector
        App.elements.keyboardTestInput?.addEventListener('keydown', (e) => this.logKeyEvent('keydown', e));
        App.elements.keyboardTestInput?.addEventListener('keypress', (e) => this.logKeyEvent('keypress', e));
        App.elements.keyboardTestInput?.addEventListener('keyup', (e) => this.logKeyEvent('keyup', e));

        // WebUSB
        App.checkAPISupport('usb' in navigator, App.getEl('webUsbApiStatus'), 'WebUSB API');
        App.getEl('scanWebUsbBtn')?.addEventListener('click', () => this.scanWebUSB());
        
        // Web Bluetooth
        App.checkAPISupport('bluetooth' in navigator, App.getEl('webBleApiStatus'), 'Web Bluetooth API');
        App.getEl('scanBleBtn')?.addEventListener('click', () => this.scanBLE());
      },
      handleMouseMove(event) {
        const now = performance.now();
        if (this.lastMouseMoveTime > 0) {
            const deltaT = now - this.lastMouseMoveTime;
            if (deltaT > 0) {
                this.mouseSamples.push(1000 / deltaT); // Instantaneous polling rate
                if (this.mouseSamples.length > 50) this.mouseSamples.shift();
                const avgPollingRate = this.mouseSamples.reduce((a, b) => a + b, 0) / this.mouseSamples.length;
                App.setText(App.getEl('mousePollingRateVal'), `${avgPollingRate.toFixed(0)} Hz`);
            }
        }
        this.lastMouseMoveTime = now;
        this.pixelSumX += Math.abs(event.movementX || 0); // For DPI calibration

        const logEl = App.getEl('mouseEventLog');
        if(logEl) {
            logEl.textContent = `X: ${event.clientX}, Y: ${event.clientY}, movementX: ${event.movementX}, movementY: ${event.movementY}\n` + logEl.textContent.substring(0, 500);
        }
      },
      calibrateMouseDpi() {
        const distCm = parseFloat(App.getEl('mouseCalibrateDistCm').value);
        const distInch = distCm / 2.54; // Standard conversion
        App.getEl('mouseCalibrateDistInch').value = distInch.toFixed(2);

        if (distInch > 0 && this.pixelSumX > 0) {
            const dpi = this.pixelSumX / distInch;
            App.setText(App.getEl('mouseDpiVal'), `${dpi.toFixed(0)} DPI (Approx)`);
        } else {
            App.setText(App.getEl('mouseDpiVal'), `Invalid calibration (pixels: ${this.pixelSumX}, dist: ${distInch})`);
        }
        this.pixelSumX = 0; // Reset for next calibration
      },
      logKeyEvent(type, event) {
        const logEl = App.getEl('keyboardEventLog');
        if (!logEl) return;
        const modifiers = [];
        if (event.shiftKey) modifiers.push('Shift');
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.altKey) modifiers.push('Alt');
        if (event.metaKey) modifiers.push('Meta');

        const logEntry = `${new Date().toLocaleTimeString()} - ${type}: Key='${event.key}', Code='${event.code}', keyCode=${event.keyCode} (deprecated), Repeat=${event.repeat}, Modifiers=[${modifiers.join(', ')}]\n`;
        logEl.textContent = logEntry + logEl.textContent.substring(0, 2000); // Prepend and limit log
      },
      async scanWebUSB() { /* WebUSB logic: requestDevice, list devices, show basic descriptors */
        const listEl = App.getEl('webUsbDeviceList');
        const statusEl = App.getEl('webUsbApiStatus');
        App.setHTMLList(listEl, [], '', '', true); //isLoading true
        listEl.style.display = 'block';

        if (!('usb' in navigator)) {
            App.handleErrorText(statusEl, 'WebUSB API not supported.');
            App.setHTMLList(listEl, [], '', 'WebUSB API not supported.');
            return;
        }
        try {
            const device = await navigator.usb.requestDevice({ filters: [] }); // No filters, user picks
            if (device) {
                 App.setText(statusEl, 'Device Permission Granted (Inspect Console for more)', {status: 'success'});
                 let deviceInfo = [
                    `<strong>${device.productName || 'Unknown Product'}</strong> (by ${device.manufacturerName || 'Unknown Manufacturer'})`,
                    `Vendor ID: 0x${device.vendorId.toString(16).padStart(4,'0')}, Product ID: 0x${device.productId.toString(16).padStart(4,'0')}`,
                    `Serial: ${device.serialNumber || 'N/A'}`,
                    `USB Version: ${device.usbVersionMajor}.${device.usbVersionMinor}.${device.usbVersionSubminor}`,
                    `Device Version: ${device.deviceVersionMajor}.${device.deviceVersionMinor}.${device.deviceVersionSubminor}`,
                 ];
                 // Attempt to open, select config, claim interface (read-only for info)
                 // This part is complex and device-specific. For now, just list basic info.
                 await device.open();
                 deviceInfo.push(`Configurations: ${device.configurations.length}`);
                 if (device.configuration) {
                    deviceInfo.push(`Active Config: ${device.configuration.configurationValue}`);
                 }
                 // await device.close(); // Close after getting info to free it up
                 App.setHTMLList(listEl, deviceInfo);
            } else {
                App.setText(statusEl, 'No device selected or permission denied.', {status: 'warning'});
                 App.setHTMLList(listEl, [], '', 'No device selected.');
            }
        } catch (err) {
            App.handleErrorText(statusEl, `WebUSB Error: ${err.message}`, err);
            App.setHTMLList(listEl, [], '', `Error: ${err.message}`);
        }
      },
      async scanBLE() { /* Web Bluetooth logic: requestDevice, list services/characteristics */
        const listEl = App.getEl('webBleDeviceList');
        const statusEl = App.getEl('webBleApiStatus');
        App.setHTMLList(listEl, [], '', '', true); //isLoading true
        listEl.style.display = 'block';

        if (!('bluetooth' in navigator)) {
            App.handleErrorText(statusEl, 'Web Bluetooth API not supported.');
            App.setHTMLList(listEl, [], '', 'Web Bluetooth API not supported.');
            return;
        }
        try {
            App.setText(statusEl, 'Requesting device... (Browser prompt)', {isLoading: true});
            const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [] }); // Example: accept all
            App.setText(statusEl, `Device: ${device.name || device.id}`, {status: 'success'});
            
            let deviceInfo = [`<strong>Device: ${device.name || device.id}</strong>`];
            App.setHTMLList(listEl, deviceInfo, 'list-item', '', true);

            // const server = await device.gatt.connect();
            // deviceInfo.push(`Connected to GATT server.`);
            // const services = await server.getPrimaryServices();
            // deviceInfo.push(`Services found: ${services.length}`);
            // for (const service of services) {
            //     deviceInfo.push(`  Service: ${service.uuid}`);
            //     // const characteristics = await service.getCharacteristics();
            //     // for (const char of characteristics) { deviceInfo.push(`    Characteristic: ${char.uuid}`); }
            // }
            // device.gatt.disconnect();
            App.setHTMLList(listEl, deviceInfo, 'list-item', 'Basic device info. GATT connection not attempted in this demo.');

        } catch (err) {
            App.handleErrorText(statusEl, `BLE Error: ${err.message}`, err);
            App.setHTMLList(listEl, [], '', `Error: ${err.message}`);
        }
      },
    },

    AdvancedConnectivity: {
      init() {
        // WebRTC Test
        App.checkAPISupport(!!(window.RTCPeerConnection || window.webkitRTCPeerConnection), App.getEl('webRtcApiStatus'), 'WebRTC API');
        App.getEl('startWebRtcTestBtn')?.addEventListener('click', () => this.runWebRtcLoopbackTest());
        
        // Reporting API
        App.checkAPISupport(!!window.ReportingObserver, App.getEl('reportingApiStatus'), 'Reporting API');
        App.getEl('startReportingObserverBtn')?.addEventListener('click', () => this.startReportingObserver());
      },
      async runWebRtcLoopbackTest() { /* WebRTC loopback connection, getStats() */ 
        const logEl = App.getEl('webRtcStatsLog');
        if (!logEl) return;
        App.setButtonLoadingState(App.getEl('startWebRtcTestBtn'), true);
        logEl.textContent = 'Setting up loopback connection...\n';

        try {
            const pc1 = new RTCPeerConnection();
            const pc2 = new RTCPeerConnection();
            let statsInterval;

            pc1.onicecandidate = e => e.candidate && pc2.addIceCandidate(e.candidate);
            pc2.onicecandidate = e => e.candidate && pc1.addIceCandidate(e.candidate);
            
            // Create a data channel for something to flow
            const dc1 = pc1.createDataChannel("loopback");
            dc1.onopen = () => {
                logEl.textContent += 'DataChannel open. Sending test data...\n';
                dc1.send("Hello WebRTC!");
                 statsInterval = setInterval(async () => {
                    const stats1 = await pc1.getStats(null);
                    logEl.textContent = 'PC1 Stats:\n';
                    stats1.forEach(report => {
                        if (report.type === 'candidate-pair' && report.state === 'succeeded') { // Active pair
                            logEl.textContent += `  Active Pair: ${report.id}\n`;
                            logEl.textContent += `    RTT: ${report.currentRoundTripTime !== undefined ? (report.currentRoundTripTime * 1000).toFixed(0) + 'ms' : 'N/A'}\n`;
                            logEl.textContent += `    Available Outgoing Bitrate: ${report.availableOutgoingBitrate !== undefined ? (report.availableOutgoingBitrate / 1000).toFixed(0) + 'kbps' : 'N/A'}\n`;
                        }
                        if (report.type === 'transport' && report.selectedCandidatePairId) {
                             logEl.textContent += `  Transport (${report.id}):\n`;
                             logEl.textContent += `    Packets Sent: ${report.packetsSent}, Bytes Sent: ${report.bytesSent}\n`;
                             logEl.textContent += `    Packets Received: ${report.packetsReceived}, Bytes Received: ${report.bytesReceived}\n`;
                        }
                    });
                }, 2000); // Update stats every 2s
            };
            dc1.onmessage = e => logEl.textContent += `DataChannel received: ${e.data}\n`;
            pc2.ondatachannel = e => { const dc2 = e.channel; dc2.onmessage = dc1.onmessage; dc2.onopen = () => dc2.send("Hello Back!");};

            const offer = await pc1.createOffer();
            await pc1.setLocalDescription(offer);
            await pc2.setRemoteDescription(offer);
            const answer = await pc2.createAnswer();
            await pc2.setLocalDescription(answer);
            await pc1.setRemoteDescription(answer);

            setTimeout(() => { // Stop after some time
                clearInterval(statsInterval);
                pc1.close(); pc2.close();
                logEl.textContent += "\nLoopback test finished.";
                App.setButtonLoadingState(App.getEl('startWebRtcTestBtn'), false);
            }, 15000); // Run for 15 seconds

        } catch (err) {
            logEl.textContent += `Error: ${err.toString()}`;
            App.setButtonLoadingState(App.getEl('startWebRtcTestBtn'), false);
        }
      },
      startReportingObserver() { /* ReportingObserver logic */
        const logEl = App.getEl('reportingApiLog');
        const statusEl = App.getEl('reportingApiStatus');
        if(!logEl || !statusEl) return;
        if (!window.ReportingObserver) {
            App.handleErrorText(statusEl, 'ReportingObserver not supported.');
            return;
        }
        App.setText(statusEl, 'Observer Active', {status:'success'});
        logEl.textContent = 'Observing for browser reports...\n';
        try {
            const observer = new ReportingObserver((reports, obs) => {
                for (const report of reports) {
                    logEl.textContent += `--- Report (${report.type}) ---\n`;
                    logEl.textContent += `URL: ${report.url}\n`;
                    logEl.textContent += `Body: ${JSON.stringify(report.body, null, 2)}\n\n`;
                }
            }, {types: ['csp-violation', 'deprecation', 'intervention', 'crash', 'permissions-policy-violation'], buffered: true});
            observer.observe();
            // To generate a test report (example, will likely be blocked by CSP if you have one)
            // setTimeout(() => { document.createElement('img').src = "http://example.com/nonexistent.jpg"; }, 2000);
            App.getEl('startReportingObserverBtn').disabled = true; // Prevent multiple observers
            App.getEl('startReportingObserverBtn').textContent = 'Observing...';

        } catch (err) {
             App.handleErrorText(statusEl, `Error starting observer: ${err.message}`, err);
        }
      },
    },

    AnimationPerformance: {
      init() {
        App.getEl('runAnimationTestBtn')?.addEventListener('click', () => {
            const testType = App.getEl('animationTestSelect').value;
            this.runAnimationTest(testType);
        });
        App.checkAPISupport(!!window.PerformanceLongTaskTiming, App.getEl('animationTestLongTasks'), 'Long Tasks API', {supported: "Supported", notSupported: "Not Supported/Partial"});
      },
      runAnimationTest(testType) { /* Logic for CSS/JS animations, FPS, Long Tasks */
        const area = App.getEl('animationTestArea');
        const fpsEl = App.getEl('animationTestFps');
        const longTasksEl = App.getEl('animationTestLongTasks');
        if (!area || !fpsEl || !longTasksEl) return;

        area.innerHTML = ''; // Clear previous test
        fpsEl.textContent = 'FPS: Running...';
        longTasksEl.textContent = 'Long Tasks: 0';
        let frameCount = 0, lastTime = performance.now(), longTaskCount = 0;
        let animationId;

        // Long Task Observer
        let ltObserver;
        if (window.PerformanceLongTaskTiming) {
            ltObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    longTaskCount++;
                    longTasksEl.textContent = `Long Tasks: ${longTaskCount} (Last: ${entry.duration.toFixed(0)}ms)`;
                }
            });
            ltObserver.observe({ type: "longtask", buffered: true });
        }

        function animate(time) {
            const deltaTime = time - lastTime;
            frameCount++;
            // Calculate FPS over last ~second
            if (deltaTime > 1000) {
                fpsEl.textContent = `FPS: ${(frameCount / (deltaTime / 1000)).toFixed(1)}`;
                frameCount = 0;
                lastTime = time;
            }

            // Specific test logic
            if (testType === 'css_transforms') {
                if (!area.querySelector('.mover')) {
                    const mover = document.createElement('div');
                    mover.style.cssText = 'width:50px; height:50px; background:var(--accent-color); position:absolute; border-radius:50%; will-change:transform;';
                    area.appendChild(mover);
                    mover.animate([
                        { transform: `translate(0px, ${Math.random()*50}px) rotate(0deg)` },
                        { transform: `translate(${area.clientWidth - 50}px, ${Math.random()*50 + 50}px) rotate(360deg)` },
                        { transform: `translate(0px, ${Math.random()*50}px) rotate(0deg)` }
                    ], { duration: 2000, iterations: Infinity, easing: 'ease-in-out' });
                }
            } else if (testType === 'js_canvas_particles') {
                // Basic canvas particle animation - this would need more setup
                if (!area.querySelector('canvas')) {
                    const canvas = document.createElement('canvas');
                    canvas.width = area.clientWidth; canvas.height = area.clientHeight;
                    area.appendChild(canvas);
                    // ... particle drawing logic in the loop ...
                     const ctx = canvas.getContext('2d');
                     ctx.clearRect(0,0,canvas.width, canvas.height);
                     for(let i=0; i<50; i++) { // Draw 50 random circles
                         ctx.fillStyle = `hsla(${Math.random()*360}, 70%, 70%, 0.7)`;
                         ctx.beginPath();
                         ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*5 + 2, 0, Math.PI*2);
                         ctx.fill();
                     }
                } else {
                    const canvas = area.querySelector('canvas');
                    const ctx = canvas.getContext('2d');
                     ctx.clearRect(0,0,canvas.width, canvas.height);
                     for(let i=0; i<50; i++) { 
                         ctx.fillStyle = `hsla(${Math.random()*360}, 70%, 70%, 0.7)`;
                         ctx.beginPath();
                         ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, Math.random()*5 + 2, 0, Math.PI*2);
                         ctx.fill();
                     }
                }
            }
            // ... other tests

            animationId = requestAnimationFrame(animate);
        }
        if (this.currentAnimationId) cancelAnimationFrame(this.currentAnimationId);
        this.currentAnimationId = requestAnimationFrame(animate);

        // Stop test after some time
        setTimeout(() => {
            cancelAnimationFrame(this.currentAnimationId);
            this.currentAnimationId = null;
            if (ltObserver) ltObserver.disconnect();
            fpsEl.textContent += ' (Test Ended)';
        }, 10000); // Run for 10 seconds
      },
    },

    SecurityPermissions: {
        init() {
            App.getEl('refreshPermissionsBtn')?.addEventListener('click', () => this.loadPermissionsDashboard());
            this.loadPermissionsDashboard(); // Initial load
        },
        async loadPermissionsDashboard() {
            const grid = App.getEl('permissionsDashboardGrid');
            if (!grid) return;
            App.setHTML(grid, '<div class="info-card placeholder-card"><div class="card-value">Loading permissions...</div></div>');

            if (!navigator.permissions) {
                App.setHTML(grid, '<div class="info-card error-card"><div class="card-value">Permissions API not supported.</div></div>');
                return;
            }

            const permissionsToQuery = [
                { name: 'geolocation' }, { name: 'notifications' }, { name: 'camera' }, { name: 'microphone' },
                { name: 'midi', noSysex: true }, { name: 'clipboard-read' }, { name: 'clipboard-write' },
                { name: 'persistent-storage' }, { name: 'background-sync' }, { name: 'ambient-light-sensor' },
                { name: 'accelerometer' }, { name: 'gyroscope' }, { name: 'magnetometer' },
                // { name: 'nfc' }, // Requires user activation
                // { name: 'speaker-selection' }
            ];
            // More experimental ones, add with caution or conditional checks
            if ('usb' in navigator) permissionsToQuery.push({ name: 'usb' }); // This query is complex / not standard
            if ('bluetooth' in navigator) permissionsToQuery.push({ name: 'bluetooth' }); // Ditto


            let html = '';
            for (const perm of permissionsToQuery) {
                try {
                    // Special handling for WebUSB/WebBluetooth as direct query might not work as expected or error
                    if (perm.name === 'usb' || perm.name === 'bluetooth') {
                        html += `<div class="info-card"><div class="card-label">${perm.name} (via API check)</div><div class="card-value">${(perm.name in navigator) ? 'API Present' : 'API Not Present'}</div></div>`;
                        continue;
                    }

                    const status = await navigator.permissions.query(perm);
                    html += `<div class="info-card">
                               <div class="card-label">${perm.name}</div>
                               <div class="card-value value-${status.state}">${status.state}</div>
                             </div>`;
                } catch (err) {
                    html += `<div class="info-card">
                               <div class="card-label">${perm.name}</div>
                               <div class="card-value value-error">Error querying (${err.name})</div>
                             </div>`;
                }
            }
            grid.innerHTML = html || '<div class="info-card"><div class="card-value">No permissions queried or all failed.</div></div>';
        }
    },
    
    AccessibilityTools: {
        init() {
            App.getEl('cvdSimulationSelect')?.addEventListener('change', (e) => this.applyCvdFilter(e.target.value));
            // AOM check - might be too experimental
            // this.checkAOMSupport();
        },
        applyCvdFilter(filterName) {
            document.body.classList.remove('cvd-protanopia', 'cvd-deuteranopia', 'cvd-tritanopia', 'cvd-achromatopsia');
            if (filterName !== 'none') {
                document.body.classList.add(`cvd-${filterName}`);
            }
        },
        // checkAOMSupport() { /* Logic to check for AOM, very basic */ }
    },
    
    // ... other new modules for File Checksum, Shape Detection, WebNN following similar patterns ...
    // Example: File Checksum (Conceptual)
    FileTools: {
        init() {
            App.checkAPISupport(!!(window.File && window.FileReader && window.FileList && window.Blob && window.showOpenFilePicker && window.crypto && window.crypto.subtle), App.getEl('fileSystemApiChecksumStatus'), 'File System Access & Crypto');
            App.getEl('selectFileForChecksumBtn')?.addEventListener('click', () => App.getEl('fileForChecksum').click()); // Trigger hidden input
            App.getEl('fileForChecksum')?.addEventListener('change', (e) => this.handleFileForChecksum(e.target.files[0]));
        },
        async handleFileForChecksum(file) {
            if (!file) return;
            App.getEl('checksumFileName').textContent = `File: ${file.name} (${(file.size / (1024*1024)).toFixed(2)} MB)`;
            App.getEl('checksumResult').textContent = 'Calculating...';
            const progressBarContainer = App.getEl('checksumProgress');
            const progressBar = progressBarContainer?.querySelector('.progress-bar');
            if(progressBarContainer) progressBarContainer.style.display = 'block';
            if(progressBar) progressBar.style.width = '0%';

            try {
                const buffer = await file.arrayBuffer(); // Read whole file for simplicity in demo
                // In a real app, use file.stream() and read in chunks for large files to show progress
                const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                App.getEl('checksumResult').textContent = hashHex;
                if(progressBar) progressBar.style.width = '100%';
            } catch (err) {
                App.getEl('checksumResult').textContent = `Error: ${err.message}`;
                App.getEl('checksumResult').classList.add('value-error');
            } finally {
                 // setTimeout(() => { if(progressBarContainer) progressBarContainer.style.display = 'none'; }, 2000);
            }
        }
    }

    // Ensure all modules are initialized and their event listeners are set up in App.init()
  };

  App.init();
  window.InspectorApp = App; // For debugging
});
