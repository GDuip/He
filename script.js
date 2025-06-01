document.addEventListener('DOMContentLoaded', () => {
  const App = {
    elements: {
      appSidebar: document.getElementById('appSidebar'),
      sidebarToggleDesktop: document.getElementById('sidebarToggleDesktop'),
      desktopToggleIconOpen: document.getElementById('desktopToggleIconOpen'), // New for icon swap
      desktopToggleIconClosed: document.getElementById('desktopToggleIconClosed'), // New for icon swap
      sidebarToggleMobile: document.getElementById('sidebarToggleMobile'),
      navLinks: document.querySelectorAll('.app-sidebar .nav-link'),
      pageTitle: document.querySelector('.page-header h1'),
      contentPanels: document.querySelectorAll('.content-panel'),
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      themeIconSun: document.getElementById('themeIconSun'),
      themeIconMoon: document.getElementById('themeIconMoon'),
      copyReportBtn: document.getElementById('copyReportBtn'),
      currentYear: document.getElementById('currentYear'),
      tooltip: document.getElementById('tooltip'),
      // Display
      loadMultiScreenBtn: document.getElementById('loadMultiScreenBtn'),
      startRefreshRateTestBtn: document.getElementById('startRefreshRateTestBtn'),
      // Media Buttons (Ensure these IDs are in the updated HTML)
      loadAudioDevicesBtn: document.getElementById('loadAudioDevicesBtn'),
      checkVideoCodecsBtn: document.getElementById('checkVideoCodecsBtn'),
      checkAudioCodecsBtn: document.getElementById('checkAudioCodecsBtn'),
      checkDrmBtn: document.getElementById('checkDrmBtn'),
      checkWebRTCBtn: document.getElementById('checkWebRTCBtn'), // For enumerating WebRTC devices
      // Connectivity
      startSpeedTestBtn: document.getElementById('startSpeedTestBtn'),
      // Hardware
      loadWebGLExtensionsBtn: document.getElementById('loadWebGLExtensionsBtn'),
      // Performance
      refreshPerfMetricsBtn: document.getElementById('refreshPerfMetricsBtn'),
      loadResourceTimingsBtn: document.getElementById('loadResourceTimingsBtn'),
      // Input Devices
      checkGamepadsBtn: document.getElementById('checkGamepadsBtn'),
      // Security & Permissions
      checkPermissionsBtn: document.getElementById('checkPermissionsBtn'), // ID updated to match HTML
      // Storage
      inspectLocalStorageBtn: document.getElementById('inspectLocalStorageBtn'),
      inspectSessionStorageBtn: document.getElementById('inspectSessionStorageBtn'),
      // HDMI (populated by JS, IDs should be in HDMI panel)
      hdmiMaxResolution: document.getElementById('hdmiMaxResolution'),
      hdmiEmeHdcpStatusVal: document.getElementById('hdmiEmeHdcpStatusVal'),

      // New UI elements from Omega HTML - JS might not have handlers for all yet
      startVsyncTestBtn: document.getElementById('startVsyncTestBtn'),
      pixelTestFullscreenArea: document.getElementById('pixelTestFullscreenArea'),
      pixelPatternSelect: document.getElementById('pixelPatternSelect'),
      pixelPatternCanvas: document.getElementById('pixelPatternCanvas'),
      startBurnInSweeperBtn: document.getElementById('startBurnInSweeperBtn'),
      checkSensorApisBtn: document.getElementById('checkSensorApisBtn'),
      startComputePressureObs: document.getElementById('startComputePressureObs'),
      calibrateMouseDpiBtn: document.getElementById('calibrateMouseDpiBtn'),
      keyboardTestInput: document.getElementById('keyboardTestInput'),
      scanWebUsbBtn: document.getElementById('scanWebUsbBtn'),
      scanBleBtn: document.getElementById('scanBleBtn'),
      startShapeDetectionBtn: document.getElementById('startShapeDetectionBtn'),
      startWebRtcTestBtn: document.getElementById('startWebRtcTestBtn'), // For full loopback test
      startReportingObserverBtn: document.getElementById('startReportingObserverBtn'),
      animationTestSelect: document.getElementById('animationTestSelect'),
      runAnimationTestBtn: document.getElementById('runAnimationTestBtn'),
      checkWebNnBtn: document.getElementById('checkWebNnBtn'),
      selectFileForChecksumBtn: document.getElementById('selectFileForChecksumBtn'),
      fileForChecksum: document.getElementById('fileForChecksum'),
      cvdSimulationSelect: document.getElementById('cvdSimulationSelect'),
      pixelTestOverlay: document.getElementById('pixelTestOverlay'), // Added for pixel test
    },

    state: {
      currentTheme: localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
      isSidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
      isMobileSidebarOpen: false,
      isFpsEstimating: false,
      fpsRafId: null,
      fpsFrames: [],
      fpsVisualizerFrames: Array(60).fill(0), 
      fpsLastFrameTime: performance.now(),
      fpsVisualizerCtx: null,
      tooltipTimeout: null,
      webGlContext: null,
      performanceObserver: null, 
      lcp: null, fcp: null, fp: null,
      gamepadInterval: null,
    },

    getEl: (id) => document.getElementById(id),
    setText: (idOrEl, value, { className = 'card-value', status = '', isCode = false, append = false } = {}) => {
      const el = typeof idOrEl === 'string' ? App.getEl(idOrEl) : idOrEl;
      if (!el) return;
      const textValue = (value === undefined || value === null || String(value).trim() === '') ? 'N/A' : String(value);
      if (append) {
        el.textContent += textValue;
      } else {
        el.textContent = textValue;
      }
      el.className = className; 
      if (isCode) el.classList.add('code-text');
      if (status) el.classList.add(`value-${status}`);
    },
    setHTML: (idOrEl, htmlContent) => {
        const el = typeof idOrEl === 'string' ? App.getEl(idOrEl) : idOrEl;
        if (el) el.innerHTML = htmlContent;
    },
    setHTMLList: (containerId, itemsArray, itemClass = 'list-item', emptyMessage = 'No items found.') => {
      const container = App.getEl(containerId);
      if (!container) return;
      if (itemsArray && itemsArray.length > 0) {
        container.innerHTML = itemsArray.map(item => `<div class="${itemClass}">${item}</div>`).join('');
      } else {
        container.innerHTML = `<div class="${itemClass}">${emptyMessage}</div>`;
      }
    },
    checkAPISupport: (condition, id, featureName, availability = true) => {
      const baseText = availability ? (condition ? 'Supported' : 'Not Supported') : (condition ? 'Available' : 'Not Available');
      App.setText(id, baseText, { status: condition ? 'success' : 'warning' });
      return !!condition;
    },
    handleErrorText: (id, message = 'Error or N/A') => App.setText(id, message, { status: 'error' }),
    formatBytes: (bytes, decimals = 2) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    getStatusClass: (status) => {
      if (status === 'granted') return 'success';
      if (status === 'prompt') return 'info';
      if (status === 'denied') return 'error';
      return 'neutral';
    },

    init() {
      this.Theme.init();
      this.Sidebar.init();
      this.Navigation.init();
      this.Tooltips.init();

      this.Display.init();
      this.SystemOS.init();
      this.Hardware.init();
      this.Media.init();
      this.Connectivity.init();
      this.Browser.init();
      this.Performance.init();
      this.InputDevices.init(); 
      this.SecurityPermissions.init(); 
      this.Storage.init(); 
      this.Accessibility.init(); 
      this.HDMILimitations.init(); 

      if (this.elements.currentYear) this.elements.currentYear.textContent = new Date().getFullYear();
      this.elements.copyReportBtn?.addEventListener('click', () => this.Reporting.copyReport());
      
      // Initialize new Omega features if their buttons exist
      this.PixelTests.init();
      this.CVDSimulator.init();

      console.log("Inspector Omega Initialized.");
    },

    Theme: { 
        init() {
            document.documentElement.setAttribute('data-theme', App.state.currentTheme);
            App.Theme.updateIcon(App.state.currentTheme);
            App.elements.themeToggleBtn?.addEventListener('click', App.Theme.toggle);
        },
        toggle() {
            App.state.currentTheme = (App.state.currentTheme === 'light') ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', App.state.currentTheme);
            localStorage.setItem('theme', App.state.currentTheme);
            App.Theme.updateIcon(App.state.currentTheme);
            if (App.state.fpsVisualizerCtx) App.Display.drawFpsVisualizer();
             App.CVDSimulator.applySimulation(App.elements.cvdSimulationSelect?.value || 'none'); // Re-apply CVD on theme change
        },
        updateIcon(theme) {
            if (App.elements.themeIconSun && App.elements.themeIconMoon) {
                App.elements.themeIconSun.style.display = (theme === 'light') ? 'block' : 'none';
                App.elements.themeIconMoon.style.display = (theme === 'dark') ? 'block' : 'none';
            }
        }
    },
    Sidebar: {
        init() {
            const updateDesktopToggleIcons = () => {
                if (App.elements.desktopToggleIconOpen && App.elements.desktopToggleIconClosed) {
                    App.elements.desktopToggleIconOpen.style.display = App.state.isSidebarCollapsed ? 'none' : 'block';
                    App.elements.desktopToggleIconClosed.style.display = App.state.isSidebarCollapsed ? 'block' : 'none';
                }
            };

            App.elements.sidebarToggleDesktop?.addEventListener('click', () => {
                App.state.isSidebarCollapsed = !App.state.isSidebarCollapsed;
                App.elements.appSidebar?.classList.toggle('collapsed', App.state.isSidebarCollapsed);
                localStorage.setItem('sidebarCollapsed', App.state.isSidebarCollapsed);
                updateDesktopToggleIcons();
            });

            if (window.innerWidth > 992) { // Use 992px as breakpoint consistent with CSS
                App.elements.appSidebar?.classList.toggle('collapsed', App.state.isSidebarCollapsed);
            }
            updateDesktopToggleIcons(); // Initial icon state

            App.elements.sidebarToggleMobile?.addEventListener('click', () => {
                App.state.isMobileSidebarOpen = !App.state.isMobileSidebarOpen;
                App.elements.appSidebar?.classList.toggle('open', App.state.isMobileSidebarOpen);
                if (App.state.isMobileSidebarOpen && App.elements.appSidebar.classList.contains('collapsed')) {
                    App.elements.appSidebar.classList.remove('collapsed'); 
                }
            });

            document.addEventListener('click', (event) => {
                if (App.state.isMobileSidebarOpen && App.elements.appSidebar && App.elements.sidebarToggleMobile &&
                    !App.elements.appSidebar.contains(event.target) &&
                    !App.elements.sidebarToggleMobile.contains(event.target)) {
                    App.state.isMobileSidebarOpen = false;
                    App.elements.appSidebar.classList.remove('open');
                }
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth > 992) {
                    App.elements.appSidebar?.classList.remove('open');
                    App.state.isMobileSidebarOpen = false;
                    App.elements.appSidebar?.classList.toggle('collapsed', App.state.isSidebarCollapsed === true);
                }
                updateDesktopToggleIcons();
            });
            window.dispatchEvent(new Event('resize'));
        }
    },
    Navigation: { 
        init() {
            App.elements.navLinks.forEach(link => {
              link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPanelId = e.currentTarget.dataset.target;
                if (!targetPanelId) return;
                App.Navigation.navigateTo(targetPanelId, e.currentTarget);
                if (App.state.isMobileSidebarOpen && window.innerWidth <= 992) {
                  App.state.isMobileSidebarOpen = false;
                  App.elements.appSidebar?.classList.remove('open');
                }
              });
            });
            const activeLink = document.querySelector('.app-sidebar .nav-link.active');
            if (activeLink && App.elements.pageTitle) {
                const linkTextEl = activeLink.querySelector('.link-text');
                if (linkTextEl) App.elements.pageTitle.textContent = linkTextEl.textContent;
            }
          },
          navigateTo(targetPanelId, clickedLink) {
            App.elements.navLinks.forEach(l => l.classList.remove('active'));
            clickedLink.classList.add('active');

            App.elements.contentPanels.forEach(panel => panel.classList.remove('active'));
            const targetPanel = App.getEl(targetPanelId);
            if (targetPanel) targetPanel.classList.add('active');

            if (App.elements.pageTitle) {
                const linkTextEl = clickedLink.querySelector('.link-text');
                if (linkTextEl) App.elements.pageTitle.textContent = linkTextEl.textContent;
            }
            const mainContent = document.querySelector('.app-main-content');
            if(mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' }); else window.scrollTo({top: 0, behavior: 'smooth'});
          }
    },
    Tooltips: { 
        init() { 
            document.querySelectorAll('[title]').forEach(el => {
              let originalTitle = el.title || '';
              el.addEventListener('mouseenter', (e) => {
                const currentTitle = el.getAttribute('data-dynamic-title') || originalTitle;
                if(currentTitle) {
                  el.setAttribute('data-original-title-store', originalTitle); 
                  el.removeAttribute('title');
                  App.Tooltips.show(e.currentTarget, currentTitle);
                }
              });
              el.addEventListener('mouseleave', (e) => {
                App.Tooltips.hide();
                if(el.getAttribute('data-original-title-store')) {
                  el.setAttribute('title', el.getAttribute('data-original-title-store'));
                  el.removeAttribute('data-original-title-store');
                }
                el.removeAttribute('data-dynamic-title');
              });
            });
        },
        show(element, text) {
            const tooltipEl = App.elements.tooltip;
            if (!tooltipEl || !element || !text) return;
            tooltipEl.textContent = text;
            const rect = element.getBoundingClientRect();
            
            tooltipEl.style.left = `0px`; // Reset for offsetWidth calculation
            tooltipEl.style.top = `0px`;  // Reset for offsetHeight calculation
            tooltipEl.classList.add('visible'); // Make visible before measuring

            let top = rect.bottom + 8 + window.scrollY; 
            let left = rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2) + window.scrollX;

            if (left < 8) left = 8;
            if (left + tooltipEl.offsetWidth > window.innerWidth - 8) left = window.innerWidth - tooltipEl.offsetWidth - 8;
            if (top + tooltipEl.offsetHeight > window.innerHeight + window.scrollY - 8) { // if it goes off bottom
                top = rect.top - tooltipEl.offsetHeight - 8 + window.scrollY; // Show above
            }
             if (top < window.scrollY + 8) { // if it goes off top (when showing above)
                top = rect.bottom + 8 + window.scrollY; // Fallback to below
            }


            tooltipEl.style.left = `${left}px`;
            tooltipEl.style.top = `${top}px`;
            // Class 'visible' already added
        },
        hide() { 
            if (App.elements.tooltip) App.elements.tooltip.classList.remove('visible');
        },
        updateAndShow(element, text, duration = 2000) { 
            if(!element) return;
            element.setAttribute('data-dynamic-title', text); 
            App.Tooltips.show(element, text); 

            if (App.state.tooltipTimeout) clearTimeout(App.state.tooltipTimeout);
            App.state.tooltipTimeout = setTimeout(() => {
              App.Tooltips.hide();
              element.removeAttribute('data-dynamic-title'); 
            }, duration);
        }
    },

    Display: { 
      init() {
        this.getPrimaryInfo();
        this.getAdvancedDisplayInfo();
        App.elements.startRefreshRateTestBtn?.addEventListener('click', () => this.estimateRefreshRate(false));
        App.elements.loadMultiScreenBtn?.addEventListener('click', () => this.getMultiScreenDetails());
        this.estimateRefreshRate(true); 
      },
       getPrimaryInfo(screenObj = screen, windowObj = window) {
            try {
                App.setText('currentResolution', `${screenObj.width} x ${screenObj.height}`);
                App.setText('availableResolution', `${windowObj.innerWidth} x ${windowObj.innerHeight} (Browser Viewport)`);
                App.setText('colorDepthVal', `${screenObj.colorDepth}-bit`);
                App.setText('pixelRatioVal', windowObj.devicePixelRatio || 'N/A');
                if (screenObj.orientation) {
                    App.setText('orientationVal', screenObj.orientation.type);
                    screenObj.orientation.onchange = () => App.setText('orientationVal', screenObj.orientation.type);
                } else {
                    App.handleErrorText('orientationVal', 'Orientation API N/A');
                }
            } catch (e) {
                console.error("Error in Display.getPrimaryInfo:", e);
                App.handleErrorText('currentResolution'); 
            }
        },
        getAdvancedDisplayInfo() {
            const touchSupport = ('ontouchstart'in window || navigator.maxTouchPoints > 0);
            App.setText('touchSupportVal', touchSupport ? `${navigator.maxTouchPoints || 'Yes (Legacy Check)'}` : 'No',
                { status: touchSupport ? 'success' : 'neutral' });

            const checkMediaQuery = (mq, id, successMsg, failMsg, standardMsg) => {
              if(window.matchMedia) {
                let result = failMsg; let sClass = 'neutral';
                if(window.matchMedia(`(${mq}: high)`).matches || window.matchMedia(`(dynamic-range: high)`).matches) {result = `${successMsg} (High)`; sClass = 'success';}
                else if(window.matchMedia(`(${mq}: p3)`).matches || window.matchMedia(`(color-gamut: p3)`).matches) { result = `${successMsg} (Display-P3)`; sClass = 'success';}
                else if(window.matchMedia(`(${mq}: rec2020)`).matches || window.matchMedia(`(color-gamut: rec2020)`).matches) { result = `${successMsg} (Rec.2020)`; sClass = 'success';}
                else if(window.matchMedia(`(${mq}: standard)`).matches || window.matchMedia(`(color-gamut: srgb)`).matches || window.matchMedia(`(dynamic-range: standard)`).matches) {result = standardMsg; sClass = 'neutral';} // Added srgb
                App.setText(id, result, { status: sClass });
              } else App.handleErrorText(id, 'Media Query API N/A');
            };
            checkMediaQuery('dynamic-range', 'hdrStatusVal', 'HDR Capable', 'HDR Not Detected (SDR)', 'SDR (Standard)');
            checkMediaQuery('color-gamut', 'colorGamutStatusVal', 'Wide Color Gamut', 'Color Gamut Unknown', 'Likely sRGB');
        },
        estimateRefreshRate(quickEstimate = false) { 
            if (App.state.isFpsEstimating && !quickEstimate) return;
            App.state.isFpsEstimating = true;
            const fpsEl = App.getEl('estimatedFpsVal'), btn = App.elements.startRefreshRateTestBtn;
            const visualizerCanvas = App.getEl('fpsVisualizer');
            if (visualizerCanvas && !App.state.fpsVisualizerCtx) {
                App.state.fpsVisualizerCtx = visualizerCanvas.getContext('2d');
                if (App.state.fpsVisualizerCtx) { // Ensure context was obtained
                    visualizerCanvas.width = visualizerCanvas.offsetWidth * (window.devicePixelRatio || 1); 
                    visualizerCanvas.height = visualizerCanvas.offsetHeight * (window.devicePixelRatio || 1);
                }
            }
            App.state.fpsFrames = [];
            if (!quickEstimate) {
                if (fpsEl) fpsEl.textContent = 'Testing...';
                if (btn) btn.disabled = true;
            }
            let frameCount = 0;
            const testDuration = quickEstimate ? 500 : 2500; 
            const startTime = performance.now();
            App.state.fpsLastFrameTime = startTime;

            const animate = (currentTime) => {
                frameCount++;
                const delta = currentTime - App.state.fpsLastFrameTime;
                App.state.fpsLastFrameTime = currentTime;
                if (delta <= 0) { App.state.fpsRafId = requestAnimationFrame(animate); return; }
                const currentFPS = 1000 / delta;
                App.state.fpsFrames.push(currentFPS); 
                if (App.state.fpsVisualizerFrames.length >= 60) App.state.fpsVisualizerFrames.shift();
                App.state.fpsVisualizerFrames.push(currentFPS);

                this.drawFpsVisualizer();
                if (performance.now() - startTime < testDuration) {
                    App.state.fpsRafId = requestAnimationFrame(animate);
                } else {
                    App.state.isFpsEstimating = false;
                    const sortedFps = [...App.state.fpsFrames].sort((a, b) => a - b);
                    const mid = Math.floor(sortedFps.length / 2);
                    const medianFps = sortedFps.length % 2 !== 0 ? sortedFps[mid] : (sortedFps[mid - 1] + sortedFps[mid]) / 2;

                    if (fpsEl) fpsEl.textContent = `${Math.round(medianFps || 0)} Hz (${quickEstimate ? 'Quick Est.' : 'Median'})`;
                    if (btn && !quickEstimate) btn.disabled = false;
                    if (!quickEstimate) App.state.fpsFrames = []; 
                }
            };
            if (App.state.fpsRafId) cancelAnimationFrame(App.state.fpsRafId);
            App.state.fpsRafId = requestAnimationFrame(animate);
        },
        drawFpsVisualizer() { 
            const ctx = App.state.fpsVisualizerCtx;
            if (!ctx) return;
            const canvas = ctx.canvas, W = canvas.width, H = canvas.height;
            ctx.clearRect(0, 0, W, H);
            const barWidth = W / App.state.fpsVisualizerFrames.length;
            const maxFpsGraph = 180; 
            
            ctx.beginPath();
            App.state.fpsVisualizerFrames.forEach((val, i) => {
                const barHeight = Math.max(1, Math.min(H, ((val || 0) / maxFpsGraph) * H));
                if (i === 0) ctx.moveTo(i * barWidth, H - barHeight);
                else ctx.lineTo(i * barWidth, H - barHeight);
            });
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#3B82F6';
            ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
            ctx.stroke();
        },
        async getMultiScreenDetails() { 
             const containerEl = App.getEl('multiScreenDetailsGrid'),
                   containerWrapper = App.getEl('multiScreenDetailsGrid'); // Corrected: Grid is the container
            const btn = App.elements.loadMultiScreenBtn;
            if(!containerEl || !btn ) return; // Removed containerWrapper check as it's same as containerEl

            btn.disabled = true;
            const originalBtnText = btn.innerHTML; 
            btn.innerHTML = `<svg class="link-icon" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM4 18V6h3v1h2V6h2v1h2V6h2v1h2V6h3v12z" /><path d="M10 9H8v1h2V9zm4 0h-2v1h2V9z" /></svg> Loading...`; // Assuming icon is part of button
            
            containerEl.style.display = 'grid'; // Ensure it's visible and uses grid
            containerEl.innerHTML = '<div class="info-card placeholder-card"><p class="card-value">Querying screen details...</p></div>';

            try {
              const getDetailsFn = window.getScreenDetails || (navigator.windowManagement && navigator.windowManagement.getScreenDetails);
              if(!getDetailsFn) {
                containerEl.innerHTML = '<div class="info-card"><p class="card-value value-warning">Screen Details API not supported by this browser.</p></div>';
                return;
              }
              const screenDetails = await getDetailsFn();

              const renderFn = (details) => {
                containerEl.innerHTML = ''; 
                if (!details.screens || details.screens.length === 0) {
                    containerEl.innerHTML = '<div class="info-card"><p class="card-value">No extended screen information available.</p></div>';
                    return;
                }
                details.screens.forEach((s, i) => {
                  const card = document.createElement('div');
                  card.className = 'info-card';
                  let primaryBadge = s.isPrimary ? ' <span class="badge success">Primary</span>' : '';
                  let internalBadge = s.isInternal ? ' <span class="badge info">Internal</span>' : ' <span class="badge secondary">External</span>';
                  card.innerHTML = `
                    <div class="card-label">Screen ${i + 1}${primaryBadge}${internalBadge}</div>
                    <div class="info-grid nested"> <!-- Assuming nested grid styling -->
                        <p><strong>Label:</strong> <span class="card-value small-text code-text">${s.label || (s.id ? `Sys ID: ${s.id.slice(0,15)}...` : 'N/A')}</span></p>
                        <p><strong>Resolution:</strong> <span class="card-value small-text">${s.width}x${s.height}</span></p>
                        <p><strong>Color Depth:</strong> <span class="card-value small-text">${s.colorDepth || screen.colorDepth}-bit</span></p>
                        <p><strong>Pixel Ratio:</strong> <span class="card-value small-text">${s.devicePixelRatio || window.devicePixelRatio}</span></p>
                        <p><strong>Available Area:</strong> <span class="card-value small-text">${s.availWidth}x${s.availHeight} (at ${s.availLeft},${s.availTop})</span></p>
                        <p><strong>Orientation:</strong> <span class="card-value small-text">${s.orientation ? s.orientation.type + (s.orientation.angle ? ` (${s.orientation.angle}°)` : '')  : 'N/A'}</span></p>
                    </div>`;
                  containerEl.appendChild(card);
                });
                const primaryScreen = screenDetails.currentScreen || details.screens.find(s => s.isPrimary);
                if (primaryScreen) {
                    App.Display.getPrimaryInfo(primaryScreen, primaryScreen); 
                }
              };
              renderFn(screenDetails);
              screenDetails.addEventListener('screenschange', () => renderFn(screenDetails));
              screenDetails.addEventListener('currentscreenchange', () => renderFn(screenDetails));

            } catch (e) {
              console.error("Multi-screen error:", e);
              containerEl.innerHTML = `<div class="info-card"><p class="card-value value-error">Error: ${e.name} - ${e.message}. Ensure permission is granted if prompted.</p></div>`;
            } finally {
              btn.disabled = false;
              btn.innerHTML = originalBtnText;
            }
        }
    },
    SystemOS: { 
        init() {
            this.getOSInfo();
            this.getBatteryInfo();
        },
        getOSInfo() { 
            try {
                App.setText('osPlatformVal', navigator.platform || 'N/A');
                App.setText('userAgentFullVal', navigator.userAgent || 'N/A', { isCode: true });
                if (navigator.userAgentData) {
                    const uad = navigator.userAgentData;
                    App.setText('osUadPlatformVal', uad.platform || 'N/A');
                    App.setText('osUadArchVal', uad.architecture || 'N/A'); // Added this line which was missing
                    let osVer = uad.platformVersion || "";
                    if (uad.platform === "Windows" && osVer) {
                        const buildMatch = osVer.match(/\b(\d{5,})\b/) || osVer.match(/\.([0-9]+)$/);
                        const build = buildMatch ? parseInt(buildMatch[1] || buildMatch[0].substring(1)) : null;
                        let winName = "Windows";
                        if (build) {
                            if (build >= 22000) winName = "Windows 11";
                            else if (build >= 10240 && build < 22000) winName = "Windows 10";
                            // else if (build >= 9200) winName = "Windows 8/8.1"; // UAD might not provide for older OS
                            osVer = `${osVer} (${winName})`;
                        }
                    } else if (uad.platform === "macOS" && osVer) {
                        // macOS versions are usually simpler like "13.4.0"
                    }
                    App.setText('osUadVersionVal', osVer || "N/A", { isCode: true });
                } else {
                    ['osUadPlatformVal', 'osUadVersionVal', 'osUadArchVal'].forEach(id => App.handleErrorText(id, 'UAD API N/A'));
                }
                const ua = navigator.userAgent.toLowerCase();
                let consoleHint = 'Not Detected';
                if (ua.includes('playstation 5') || ua.includes('ps5')) consoleHint = 'PlayStation 5';
                else if (ua.includes('playstation 4') || ua.includes('ps4')) consoleHint = 'PlayStation 4';
                else if (ua.includes('xbox series x') || ua.includes('xbox series s') || (ua.includes('xbox') && (ua.includes('edgex') || ua.includes('gamecore')))) consoleHint = 'Xbox Series X/S';
                else if (ua.includes('xbox one') || (ua.includes('xbox') && !ua.includes('edgex') && !ua.includes('gamecore'))) consoleHint = 'Xbox One';
                else if (ua.includes('nintendo switch') || ua.includes('nintendobrowser')) consoleHint = 'Nintendo Switch';
                else if (ua.includes('steam deck') || ua.includes('steamos')) consoleHint = 'Steam Deck'; 
                else if (ua.includes('valve')) consoleHint = 'Valve Device (SteamOS?)';

                App.setText('gameConsoleHintVal', consoleHint, { status: consoleHint !== 'Not Detected' ? 'info' : 'neutral' });
            } catch (e) { console.error("OS Info Error:", e); }
        },
        async getBatteryInfo() { 
            const statusElId = 'batteryStatusVal',
            barContainer = App.getEl('batteryLevelBarContainer'),
            bar = App.getEl('batteryLevelBar');
          if (!('getBattery'in navigator)) {
            App.setText(statusElId, 'Battery API N/A', { status: 'warning' });
            if (barContainer) barContainer.style.display = 'none';
            return;
          }
          try {
            const battery = await navigator.getBattery();
            const msToMinSec = (ms) => {
              if (!isFinite(ms) || ms === 0) return '?';
              const totalSeconds = Math.floor(ms / 1000);
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = totalSeconds % 60;
              return `${minutes}m ${seconds}s`;
            }
            const updateFn = () => {
              let text = `${(battery.level * 100).toFixed(0)}%`;
              if (battery.charging) {
                text += ` (Charging${battery.chargingTime !== Infinity && battery.chargingTime > 0 ? ', ' + msToMinSec(battery.chargingTime * 1000) + ' to full' : ''})`;
              } else {
                text += ` (${battery.dischargingTime !== Infinity && battery.dischargingTime > 0 ? msToMinSec(battery.dischargingTime * 1000) + ' left, ' : ''}Discharging)`;
              }
              if (barContainer && bar) {
                barContainer.style.display = 'flex'; 
                bar.style.width = `${battery.level * 100}%`;
                let barColor = 'var(--success-color)';
                if (battery.level <= 0.1 && !battery.charging) barColor = 'var(--error-color)';
                else if (battery.level <= 0.2 && !battery.charging) barColor = 'var(--warning-color)';
                bar.style.backgroundColor = barColor;
              }
              App.setText(statusElId, text, { status: battery.level <= 0.2 && !battery.charging ? 'warning' : 'neutral' });
            };
            updateFn();
            ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'].forEach(ev => battery.addEventListener(ev, updateFn));
          } catch (e) {
            console.error("Battery API Error:", e);
            App.setText(statusElId, 'Error accessing Battery API', { status: 'error' });
            if (barContainer) barContainer.style.display = 'none';
          }
        }
    },
    Hardware: { 
        init() {
            App.setText('cpuCoresVal', navigator.hardwareConcurrency || 'N/A');
            App.setText('deviceMemoryVal', navigator.deviceMemory ? `${navigator.deviceMemory} GB (Minimum Reported)` : 'Device Memory API N/A');
            this.getWebGLContextAndInfo();
            this.checkEMEPolicySupport('hdcp', 'emeHdcpStatusVal'); // Check for HDCP requirement support directly
            App.elements.loadWebGLExtensionsBtn?.addEventListener('click', () => this.listWebGLExtensions());
        },
        getWebGLContextAndInfo() { 
            const canvas = document.createElement('canvas');
            try { App.state.webGlContext = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'); } catch (e) {}
            const gl = App.state.webGlContext;
            if (gl) {
                const versionString = gl.getParameter(gl.VERSION);
                let majorVersion = "N/A";
                if (versionString.includes("WebGL 2.0")) majorVersion = "2.0";
                else if (versionString.includes("WebGL 1.0")) majorVersion = "1.0";
                else { 
                    const esMatch = versionString.match(/OpenGL ES (\d\.\d)/);
                    if (esMatch && esMatch[1]) majorVersion = `ES ${esMatch[1]} (via WebGL)`;
                }
                App.setText('webglVersionVal', majorVersion, { status: majorVersion !== "N/A" ? 'success' : 'warning' });

                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    App.setText('gpuRendererVal', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'N/A', { isCode: true });
                    const angle = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    App.setText('webglAngleVal', angle && angle.toLowerCase().includes('angle') ? angle : 'N/A or Not ANGLE', { isCode: true, status: angle && angle.toLowerCase().includes('angle') ? 'info' : 'neutral' });
                } else {
                    App.handleErrorText('gpuRendererVal', 'Debug Info N/A');
                    App.setText('webglAngleVal', 'N/A', { isCode: true });
                }
            } else {
                ['webglVersionVal', 'gpuRendererVal', 'webglAngleVal'].forEach(id => App.handleErrorText(id, 'WebGL N/A'));
            }
        },
        listWebGLExtensions() { 
            const gl = App.state.webGlContext;
            const listElId = 'webGlExtensionsList';
            if (gl) {
              const extensions = gl.getSupportedExtensions();
              if (extensions && extensions.length > 0) {
                App.setText(listElId, extensions.join('\n'), { isCode: true });
              } else { App.setText(listElId, 'No extensions reported.', { isCode: true }); }
            } else { App.setText(listElId, 'WebGL context N/A.', { isCode: true, status: 'warning' });}
        },
        async checkEMEPolicySupport(policy, elementId = 'emeHdcpStatusVal', drmSystem = 'com.widevine.alpha') {
            if (!navigator.requestMediaKeySystemAccess) {
                App.handleErrorText(elementId, 'EME API N/A');
                return;
            }
            const videoConfig = { contentType: 'video/mp4; codecs="avc1.42E01E"'};
            if (policy === 'hdcp') videoConfig.hdcp = 'required'; 

            const config = [{ videoCapabilities: [videoConfig] }];
            try {
                await navigator.requestMediaKeySystemAccess(drmSystem, config);
                App.setText(elementId, `${drmSystem.split('.')[1]} + ${policy.toUpperCase()} Policy Test: Supported`, { status: 'success' });
            } catch (e) {
                App.setText(elementId, `${drmSystem.split('.')[1]} + ${policy.toUpperCase()} Policy Test: Failed/Unsupported`, { status: 'warning' });
                console.warn(`EME Test Error (${policy}):`, e);
            }
        }
    },
    Media: { 
        init() {
            App.elements.loadAudioDevicesBtn?.addEventListener('click', () => this.getAudioDevices());
            App.elements.checkVideoCodecsBtn?.addEventListener('click', () => this.checkAllVideoCodecs());
            App.elements.checkAudioCodecsBtn?.addEventListener('click', () => this.checkAllAudioCodecs());
            App.elements.checkDrmBtn?.addEventListener('click', () => this.checkDRMSupport());
            App.elements.checkWebRTCBtn?.addEventListener('click', () => this.getWebRTCInfo(false)); // Explicit click for full enumeration
            this.getAudioContextInfo(); 
            this.getWebRTCInfo(true); 
        },
        getAudioContextInfo() {
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) {
                    const audioCtx = new AC();
                    App.setText('audioCtxSampleRate', audioCtx.sampleRate ? `${audioCtx.sampleRate} Hz` : 'N/A', { status: audioCtx.sampleRate ? 'success' : 'warning' });
                    App.setText('audioCtxOutputLatency', audioCtx.outputLatency !== undefined ? `${(audioCtx.outputLatency).toFixed(4)} s` : (audioCtx.baseLatency !== undefined ? `${(audioCtx.baseLatency).toFixed(4)} s (Base)` : 'N/A'), { status: audioCtx.outputLatency !== undefined || audioCtx.baseLatency !== undefined ? 'success' : 'neutral'});
                    audioCtx.close().catch(e => console.warn("Error closing AudioContext:", e));
                } else {
                    App.handleErrorText('audioCtxSampleRate', 'AudioContext API N/A');
                    App.handleErrorText('audioCtxOutputLatency');
                }
            } catch (e) {
                App.handleErrorText('audioCtxSampleRate', `Error: ${e.name}`);
                App.handleErrorText('audioCtxOutputLatency');
                console.error("AudioContext Error:", e);
            }
        },
        async getWebRTCInfo(passive = false) {
            App.checkAPISupport(typeof RTCPeerConnection !== 'undefined', 'webRtcPeerConn', 'RTCPeerConnection');
            App.checkAPISupport(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function', 'webRtcGetUserMedia', 'getUserMedia API');

            const listId = 'webRtcMediaDevicesList';
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                App.setHTMLList(listId, [], 'list-item value-warning', 'MediaDevices API N/A for enumeration.');
                return;
            }
             App.setHTML(listId, '<div class="list-item">Querying devices...</div>');

            try {
                if (!passive) { 
                    await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); 
                }
                const devices = await navigator.mediaDevices.enumerateDevices();
                const deviceItems = devices.map(d => {
                    let icon = d.kind === 'audioinput' ? '🎤' : d.kind === 'videoinput' ? '📹' : (d.kind === 'audiooutput' ? '🔊' : '⚙️');
                    return `<strong>${icon} ${d.label || `Device (${d.kind.replace('input', '')})`}</strong> <code class="small-text">${d.deviceId ? d.deviceId.slice(0,10)+'...' : 'N/A'}</code>`;
                });
                App.setHTMLList(listId, deviceItems, 'list-item', 'No media devices found or permission denied.');
            } catch (e) {
                 let errorMsg = `Error enumerating devices: ${e.name}.`;
                 if(e.name === "NotAllowedError" || e.name === "PermissionDeniedError") errorMsg += " Permission denied.";
                 else if (passive && (e.name === "NotFoundError" || e.name === "DevicesNotFoundError")) errorMsg = "No devices found (or permission not yet granted for labels).";
                 else if (!passive) errorMsg = "Failed to get media permissions. Check browser settings.";

                App.setHTMLList(listId, [], 'list-item value-error', errorMsg);
                console.warn("WebRTC media devices error:", e);
            }
        },
        async getAudioDevices() { 
            const listId = 'audioDevicesList';
            App.setHTML(listId, '<div class="list-item">Querying... (May require mic permission for full list/labels)</div>');
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                App.setHTMLList(listId, [], 'list-item value-warning', 'MediaDevices API N/A'); return;
            }
            try { 
                await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (e) { console.warn("Mic permission potentially needed for full audio device labels. Error:", e.name); }

            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const outputs = devices.filter(d => d.kind === 'audiooutput').map(d =>
                    `<strong>${d.label || `Output Device (ID: ${d.deviceId ? d.deviceId.slice(0,10)+'...' : 'N/A'})`}</strong> ${d.deviceId === 'default' ? '<span class="badge info">Default</span>' : ''}`
                );
                App.setHTMLList(listId, outputs, 'list-item', 'No audio output devices identified or permission denied.');
            } catch (e) { App.setHTMLList(listId, [], 'list-item value-error', `Error: ${e.message}`);}
        },
         async _checkCodec(config, name, containerId, type = 'decoding') { // 'type' here is 'videoDecoding' or 'audioDecoding'
            const container = App.getEl(containerId);
            if(!container) return;
            const itemId = `${name.replace(/[\s().;/="']/g,'')}_status_item`;
            let itemEl = container.querySelector(`#${itemId}`);
            if (!itemEl) {
                itemEl = document.createElement('div'); itemEl.className = 'list-item'; itemEl.id = itemId;
                container.appendChild(itemEl);
            }
            itemEl.innerHTML = `<span class="status-dot neutral"></span> Checking <strong>${name}</strong>...`;

            const mediaCapsType = type.startsWith('video') ? 'video' : 'audio';
            const decodingOrEncoding = type.endsWith('Decoding') ? 'decodingInfo' : (type.endsWith('Encoding') ? 'encodingInfo' : 'decodingInfo');


            if (!('mediaCapabilities'in navigator) || !navigator.mediaCapabilities[decodingOrEncoding]) {
                itemEl.innerHTML = `<span class="status-dot warning"></span> <strong>${name}:</strong> MediaCaps API N/A`; return;
            }
            try {
                const capConfig = { type: 'file', [mediaCapsType]: config }; 

                const res = await navigator.mediaCapabilities[decodingOrEncoding](capConfig);
                let text = res.supported ? `Supported (Smooth: ${res.smooth ? '✅' : '❌'}, Power Efficient: ${res.powerEfficient ? '✅' : '❌'})` : 'Not Supported';
                let statClass = res.supported ? 'success' : 'error';
                itemEl.innerHTML = `<span class="status-dot ${statClass}"></span> <strong class="value-${statClass}">${name}:</strong> ${text}<br/><code>${config.contentType}</code>`;
            } catch (e) {
                itemEl.innerHTML = `<span class="status-dot error"></span> <strong class="value-error">${name}: Error (${e.name})</strong><br/><code>${config.contentType}</code>`;
                console.warn(`Codec check error for ${name}:`, e);
            }
        },
        checkAllVideoCodecs() { 
            const listId = 'videoCodecsSupportList'; App.setHTML(listId, ''); 
            const commonDecCodecs = [
                { name: 'H.264 (AVC) Baseline', config: { contentType: 'video/mp4; codecs="avc1.42E01E"' } },
                { name: 'H.265 (HEVC) Main', config: { contentType: 'video/mp4; codecs="hvc1.1.6.L93.B0"' } },
                { name: 'VP9 Profile 0', config: { contentType: 'video/webm; codecs="vp09.00.10.08"' } },
                { name: 'AV1 Main Profile', config: { contentType: 'video/mp4; codecs="av01.0.04M.08"' } },
            ];
            commonDecCodecs.forEach(c => this._checkCodec(c.config, c.name, listId, 'videoDecoding')); 
        },
        checkAllAudioCodecs() { 
            const listId = 'audioCodecsSupportList'; App.setHTML(listId, '');
            const commonDecCodecs = [
                { name: 'AAC-LC', config: { contentType: 'audio/mp4; codecs="mp4a.40.2"' } },
                { name: 'Opus', config: { contentType: 'audio/webm; codecs="opus"' } },
                { name: 'FLAC', config: { contentType: 'audio/flac' } },
                { name: 'MP3', config: { contentType: 'audio/mpeg' } },
            ];
            commonDecCodecs.forEach(c => this._checkCodec(c.config, c.name, listId, 'audioDecoding')); 
        },
        async checkDRMSupport() { 
            const listId = 'drmSupportList'; App.setHTML(listId, '<div class="list-item"><span class="status-dot neutral"></span> Checking...</div>');
            if (!navigator.requestMediaKeySystemAccess) {
                App.setHTMLList(listId, ['<span class="status-dot warning"></span> MediaKeySystemAccess API N/A'], 'list-item'); return;
            }
            const systems = [
                { name: 'Widevine', id: 'com.widevine.alpha' }, { name: 'PlayReady', id: 'com.microsoft.playready' },
                { name: 'FairPlay', id: 'com.apple.fps' }, { name: 'Clear Key', id: 'org.w3.clearkey' },
            ];
            let results = [];
            for (const s of systems) {
                try {
                    await navigator.requestMediaKeySystemAccess(s.id, [{ videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.4D401E"' }] }]);
                    results.push(`<span class="status-dot success"></span><strong class="value-success">${s.name}:</strong> Supported`);
                } catch (e) { results.push(`<span class="status-dot error"></span><strong>${s.name}:</strong> Not Supported/Error`); }
            }
            App.setHTMLList(listId, results, 'list-item');
        },
    },
    Connectivity: { 
        init() {
            this.updateStatus();
            if ('connection' in navigator && navigator.connection) {
                navigator.connection.addEventListener('change', () => this.updateStatus());
            }
            window.addEventListener('online', () => this.updateStatus(true));
            window.addEventListener('offline', () => this.updateStatus(false));
            App.elements.startSpeedTestBtn?.addEventListener('click', () => this.startSpeedTest());
        },
        updateStatus(onlineOverride = null) {
            const isOnline = onlineOverride !== null ? onlineOverride : navigator.onLine;
            App.setText('onlineStatusVal', isOnline ? 'Online' : 'Offline', { status: isOnline ? 'success' : 'error' });

            if ('connection' in navigator && navigator.connection) {
                const conn = navigator.connection;
                App.setText('connectionTypeVal', conn.effectiveType || 'N/A', {status: conn.effectiveType ? 'info' : 'neutral'});
                App.setText('connectionDownlinkVal', conn.downlink ? `${conn.downlink} Mbps (Effective Est.)` : 'N/A');
                App.setText('connectionRttVal', conn.rtt !== undefined ? `${conn.rtt} ms (Effective Est.)` : 'N/A');
                App.setText('connectionSaveDataVal', conn.saveData ? 'Enabled' : 'Disabled', { status: conn.saveData ? 'warning' : 'neutral' });
            } else {
                ['connectionTypeVal', 'connectionDownlinkVal', 'connectionRttVal', 'connectionSaveDataVal'].forEach(id => App.handleErrorText(id, 'NetInfo API N/A'));
            }
        },
        async startSpeedTest() {
            const resultId = 'speedTestResultVal', progContainer = App.getEl('speedTestProgressContainer'),
                  progBar = App.getEl('speedTestProgressBar'), btn = App.elements.startSpeedTestBtn;
            if(!App.getEl(resultId) || !btn) return;

            App.setText(resultId, 'Initializing Test...');
            btn.disabled = true;
            if(progContainer) progContainer.style.display = 'flex';
            if(progBar) progBar.style.width = '0%';

            const testFile = `https://cachefly.cachefly.net/10mb.test?rand=${Date.now()}`; 
            const fileSizeMB = 10;
            let receivedLength = 0;
            const totalSize = fileSizeMB * 1024 * 1024; 

            try {
                App.setText(resultId, 'Testing Download...');
                const startTime = performance.now();
                const response = await fetch(testFile, { method: 'GET', cache: 'no-store', mode: 'cors' });
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                if (!response.body) throw new Error('Response body is null');


                const reader = response.body.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) receivedLength += value.length;
                    if (progBar) progBar.style.width = `${Math.min(100, (receivedLength / totalSize) * 100)}%`;
                }
                const durationSecs = (performance.now() - startTime) / 1000;
                if (durationSecs < 0.1) { 
                    App.setText(resultId, `Too fast to measure accurately (<0.1s) with ${fileSizeMB}MB file.`, {status: 'warning'});
                } else {
                    const speedMbps = ((receivedLength * 8) / (1024 * 1024)) / durationSecs;
                    App.setText(resultId, `${speedMbps.toFixed(2)} Mbps`);
                }
                if (progBar) progBar.style.width = '100%';
            } catch (e) {
                console.error("Speedtest Error:", e);
                App.setText(resultId, `Error: ${e.message.slice(0,40)}...`, { status: 'error' });
            } finally {
                btn.disabled = false;
                setTimeout(() => {
                    if(progContainer) progContainer.style.display = 'none';
                    if(progBar) progBar.style.width = '0%';
                }, 2000);
            }
        }
    },
    Browser: { 
        init() { this.getDetails(); },
        getDetails() {
            if (navigator.userAgentData) {
                const uad = navigator.userAgentData;
                const primaryBrand = uad.brands.find(b => !b.brand.match(/not.*?a.*?brand/i) && !b.brand.toLowerCase().includes("chromium")) || uad.brands.find(b => !b.brand.match(/not.*?a.*?brand/i)) || uad.brands[0];
                App.setText('browserNameVersionUadVal', primaryBrand ? `${primaryBrand.brand} ${primaryBrand.version}` : "N/A (UAD)");
                App.setText('browserBrandsUadVal', uad.brands.map(b => `${b.brand} ${b.version}`).join(';\n ') || "N/A", { isCode: true });
                App.setText('browserMobileUadVal', uad.mobile ? 'Yes' : 'No', { status: uad.mobile ? 'info' : 'neutral' });
            } else {
                ['browserNameVersionUadVal', 'browserBrandsUadVal', 'browserMobileUadVal'].forEach(id => App.handleErrorText(id, 'UAD API N/A - Using UA Fallback'));
                const ua = navigator.userAgent;
                let browserName = "Unknown", browserVersion = "Unknown";
                const matchers = [ 
                    { regex: /Edg.*?\/(.*?)(?:\.|$|\s)/, name: "Edge (Chromium)" },
                    { regex: /Edge\/(.*?)(?:\.|$|\s)/, name: "Edge (Legacy)" },
                    { regex: /Firefox\/(.*?)(?:\.|$|\s)/, name: "Firefox" },
                    { regex: /OPR\/(.*?)(?:\.|$|\s)/, name: "Opera" },
                    { regex: /Chrome\/(.*?)(?:\.|$|\s)/, name: "Chrome" }, 
                    { regex: /Version\/(.*?)\s.*?Safari\//, name: "Safari" },
                ];
                for (let m of matchers) {
                    const match = ua.match(m.regex);
                    if (match && match[1]) { browserName = m.name; browserVersion = match[1]; break; }
                }
                App.setText('browserNameVersionUadVal', `${browserName} ${browserVersion} (UA Fallback)`);
            }
            App.setText('browserLanguagesVal', navigator.languages ? navigator.languages.join(', ') : (navigator.language || 'N/A'), { isCode: true });
            App.checkAPISupport(navigator.cookieEnabled, 'cookiesEnabledVal', 'Cookies');
        }
    },
    Performance: { 
        init() {
            this.observePerformance();
            this.queryPerformanceMetrics(); 
            App.elements.refreshPerfMetricsBtn?.addEventListener('click', () => this.queryPerformanceMetrics());
            App.elements.loadResourceTimingsBtn?.addEventListener('click', () => this.getResourceTimings());
            this.getJsMemoryInfo(); 
        },
        observePerformance() {
            if ('PerformanceObserver' in window) {
                App.state.performanceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-paint') App.state.fp = entry.startTime;
                        if (entry.name === 'first-contentful-paint') App.state.fcp = entry.startTime;
                        if (entry.entryType === 'largest-contentful-paint') App.state.lcp = entry.startTime;
                    }
                    this.updatePerformanceMetricsDisplay(); 
                });
                try {
                    App.state.performanceObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
                } catch (e) { console.warn('PerformanceObserver failed for some entry types:', e.message); }
            }
        },
        updatePerformanceMetricsDisplay() {
            const formatTime = (val) => (val !== null && val > 0) ? `${val.toFixed(0)} ms` : 'N/A';
            App.setText('perfFpVal', formatTime(App.state.fp), {status: App.state.fp ? (App.state.fp < 1000 ? 'success' : (App.state.fp < 2500 ? 'warning' : 'error')) : 'neutral'});
            App.setText('perfFcpVal', formatTime(App.state.fcp), {status: App.state.fcp ? (App.state.fcp < 1800 ? 'success' : (App.state.fcp < 3000 ? 'warning' : 'error')) : 'neutral'});
            App.setText('perfLcpVal', formatTime(App.state.lcp), {status: App.state.lcp ? (App.state.lcp < 2500 ? 'success' : (App.state.lcp < 4000 ? 'warning' : 'error')) : 'neutral'});
        },
        queryPerformanceMetrics() {
            if (window.performance) {
                const navEntries = window.performance.getEntriesByType && window.performance.getEntriesByType("navigation");
                if (navEntries && navEntries.length > 0) {
                    const nav = navEntries[0];
                    App.setText('perfNavTypeVal', { 'navigate': 'Nav', 'reload': 'Reload', 'back_forward': 'History', 'prerender': 'Prerender' }[nav.type] || nav.type || 'Unknown');
                    const formatNavTime = (val) => (val > 0) ? `${val.toFixed(0)} ms` : 'N/A';
                    App.setText('perfTtfbVal', formatNavTime(nav.responseStart), {status: nav.responseStart ? (nav.responseStart < 200 ? 'success' : (nav.responseStart < 500 ? 'warning': 'error')) : 'neutral'});
                    App.setText('perfDomInteractiveVal', formatNavTime(nav.domInteractive));
                    App.setText('perfDomLoadedVal', formatNavTime(nav.domContentLoadedEventEnd));
                    App.setText('perfLoadTimeVal', formatNavTime(nav.loadEventEnd));
                } else { 
                    const t = window.performance.timing;
                    if (t) { 
                        App.setText('perfNavTypeVal', {0:'Nav',1:'Reload',2:'History',255:'Other'}[window.performance.navigation.type] || 'Legacy/Unknown');
                        const formatLegacy = (end,start) => (end && start && end > start) ? `${(end-start).toFixed(0)} ms` : 'N/A';
                        App.setText('perfTtfbVal', formatLegacy(t.responseStart, t.navigationStart));
                        App.setText('perfDomInteractiveVal', formatLegacy(t.domInteractive, t.navigationStart));
                        App.setText('perfDomLoadedVal', formatLegacy(t.domContentLoadedEventEnd, t.navigationStart));
                        App.setText('perfLoadTimeVal', formatLegacy(t.loadEventEnd, t.navigationStart));
                    } else { 
                        ['perfNavTypeVal','perfTtfbVal','perfDomInteractiveVal','perfDomLoadedVal','perfLoadTimeVal'].forEach(id => App.handleErrorText(id, 'NavTiming API N/A'));
                    }
                }
                const paintEntries = window.performance.getEntriesByType && window.performance.getEntriesByType("paint");
                if(paintEntries){
                    paintEntries.forEach(entry => {
                        if (entry.name === 'first-paint' && !App.state.fp) App.state.fp = entry.startTime;
                        if (entry.name === 'first-contentful-paint' && !App.state.fcp) App.state.fcp = entry.startTime;
                    });
                }
                this.updatePerformanceMetricsDisplay();
            } else { 
                 ['perfNavTypeVal','perfTtfbVal','perfDomInteractiveVal','perfDomLoadedVal','perfLoadTimeVal', 'perfFpVal', 'perfFcpVal', 'perfLcpVal'].forEach(id => App.handleErrorText(id, 'Performance API N/A'));
            }
            this.getJsMemoryInfo(); 
        },
        getJsMemoryInfo() {
            if (window.performance && window.performance.memory) {
                const m = window.performance.memory;
                App.setText('perfJsHeapLimitVal', App.formatBytes(m.jsHeapSizeLimit));
                App.setText('perfJsHeapTotalVal', App.formatBytes(m.totalJSHeapSize));
                App.setText('perfJsHeapUsedVal', App.formatBytes(m.usedJSHeapSize));
            } else { ['perfJsHeapLimitVal','perfJsHeapTotalVal','perfJsHeapUsedVal'].forEach(id => App.handleErrorText(id, 'PerfMem API N/A')); }
        },
        getResourceTimings() {
            const gridContainer = App.getEl('resourceTimingOverviewGrid');
            const detailsCard = App.getEl('resourceTimingDetailsCard');
            const detailsList = App.getEl('resourceTimingDetailsList');
            if (!gridContainer ) return; // Removed detailsCard, detailsList check as they are optional display

            if (!window.performance || !window.performance.getEntriesByType) {
                App.setText('totalResources', 'Resource Timing API N/A', { status: 'warning' });
                return;
            }
            const resources = window.performance.getEntriesByType("resource");
            App.setText('totalResources', resources.length);

            const summary = {};
            let totalSize = 0;
            resources.forEach(res => {
                summary[res.initiatorType] = (summary[res.initiatorType] || 0) + 1;
                totalSize += res.transferSize || res.decodedBodySize || 0; 
            });

            gridContainer.innerHTML = ''; 
            gridContainer.appendChild(this._createResourceCard('Total Resources', resources.length));
            gridContainer.appendChild(this._createResourceCard('Total Size (Est.)', App.formatBytes(totalSize)));

            for (const type in summary) {
                gridContainer.appendChild(this._createResourceCard(`${type} count`, summary[type]));
            }
            // Optional detailed list (can be re-enabled if detailsList element exists)
            if (detailsList && detailsCard) {
                 const detailedItems = resources.slice(0, 20).map(r => // Limit to 20 for brevity
                     `<strong>${r.name.split('/').pop().slice(0,30)}...</strong> (${r.initiatorType}) - ${App.formatBytes(r.transferSize || r.decodedBodySize || 0)} - ${r.duration.toFixed(0)}ms`
                 );
                 App.setHTMLList(detailsList, detailedItems, 'list-item', 'No resources to detail or list element missing.');
                 detailsCard.style.display = 'block';
            }
        },
        _createResourceCard(label, value) {
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `<div class="card-label">${label}</div><div class="card-value">${value}</div>`;
            return card;
        }
    },

    InputDevices: { 
        init() {
            this.getPointerInfo();
            App.setText('maxTouchPointsDetail', navigator.maxTouchPoints || (('ontouchstart' in window) ? 'Legacy Touch Detected' : '0'));
            App.elements.checkGamepadsBtn?.addEventListener('click', () => this.checkGamepads());
        },
        getPointerInfo() {
            let primaryPointer = 'Unknown';
            if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) primaryPointer = 'Touch (Coarse)';
            else if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) primaryPointer = 'Mouse/Stylus (Fine)';
            else if (window.matchMedia && window.matchMedia('(pointer: none)').matches) primaryPointer = 'None';
            App.setText('primaryPointerType', primaryPointer);

            if (window.PointerEvent) App.setText('primaryPointerType', primaryPointer + ' (PointerEvents)', { append: true, className: 'card-value small-text value-info'});
            else if ('ontouchstart' in window) App.setText('primaryPointerType', primaryPointer + ' (TouchEvents)', { append: true, className: 'card-value small-text value-info' });
        },
        checkGamepads() {
            if (App.state.gamepadInterval) clearInterval(App.state.gamepadInterval);
            const container = App.getEl('gamepadListContainer');
            if (!container) { console.warn("Gamepad list container not found"); return; }
            App.setHTML(container,'<div class="list-item">Scanning for gamepads... Connect or press buttons.</div>');

            if (!navigator.getGamepads) {
                App.setHTML(container, '<div class="list-item value-warning">Gamepad API not supported.</div>');
                return;
            }
            const updateGamepadDisplay = () => {
                const gamepads = navigator.getGamepads().filter(gp => gp); 
                if (gamepads.length === 0) {
                    App.setHTML(container,'<div class="list-item">No gamepads detected. Press a button on a connected gamepad.</div>');
                    return;
                }
                const gamepadItems = gamepads.map((gp, i) => {
                    let buttonsPressed = gp.buttons.reduce((acc, button, idx) => button.pressed ? acc + `B${idx} ` : acc, '').trim();
                    let axesInfo = gp.axes.map((axis, idx) => `A${idx}: ${axis.toFixed(2)}`).join(', ');
                    return `
                        <strong>Gamepad ${i}: ${gp.id.slice(0,30)}...</strong>
                        <br/><span class="small-text">Connected: ${gp.connected}, Mapping: ${gp.mapping}</span>
                        <br/><span class="small-text">Buttons: ${gp.buttons.length} (${buttonsPressed || 'None pressed'})</span>
                        <br/><span class="small-text">Axes: ${gp.axes.length} (${axesInfo || 'N/A'})</span>
                    `;
                });
                App.setHTMLList(container, gamepadItems, 'list-item');
            };
            updateGamepadDisplay(); 
            App.state.gamepadInterval = setInterval(updateGamepadDisplay, 200); 

            window.addEventListener("gamepadconnected", (e) => {
                if (App.elements.checkGamepadsBtn) App.Tooltips.updateAndShow(App.elements.checkGamepadsBtn, `Gamepad connected: ${e.gamepad.id.slice(0,20)}...`, 3000);
                updateGamepadDisplay();
            });
            window.addEventListener("gamepaddisconnected", (e) => {
                 if (App.elements.checkGamepadsBtn) App.Tooltips.updateAndShow(App.elements.checkGamepadsBtn, `Gamepad disconnected: ${e.gamepad.id.slice(0,20)}...`, 3000);
                updateGamepadDisplay();
                if (navigator.getGamepads().filter(gp => gp).length === 0 && App.state.gamepadInterval) {
                    clearInterval(App.state.gamepadInterval); 
                    App.state.gamepadInterval = null;
                }
            });
        }
    },
    SecurityPermissions: { 
        init() {
            this.checkSecureContext();
            App.elements.checkPermissionsBtn?.addEventListener('click', () => this.queryAllPermissions());
            this.queryAllPermissions(true); 
        },
        checkSecureContext() {
            App.setText('secureContextVal', window.isSecureContext ? 'Yes (HTTPS or localhost)' : 'No',
                { status: window.isSecureContext ? 'success' : 'error' });
        },
        async queryAllPermissions(silent = false) {
            const grid = App.getEl('permissionsListGrid'); // Changed from permissionsDashboardGrid for consistency
            if (!grid) return;
            if (!navigator.permissions || !navigator.permissions.query) {
                grid.innerHTML = '<div class="info-card"><p class="card-value value-warning">Permissions API not supported.</p></div>';
                return;
            }
             if(!silent) grid.innerHTML = '<div class="info-card placeholder-card"><p class="card-value">Querying permissions...</p></div>';
             else grid.innerHTML = ''; 

            const permissionsToCheck = [
                { name: 'geolocation', label: 'Geolocation', icon: '🌍' },
                { name: 'notifications', label: 'Notifications', icon: '🔔' },
                { name: 'camera', label: 'Camera Access', icon: '📷' },
                { name: 'microphone', label: 'Microphone Access', icon: '🎤' },
                { name: 'clipboard-read', label: 'Clipboard Read', icon: '📋' },
                { name: 'clipboard-write', label: 'Clipboard Write', icon: '✍️' },
                { name: 'persistent-storage', label: 'Persistent Storage', icon: '💾'},
                // { name: 'screen-wake-lock', label: 'Screen Wake Lock', icon: '💡' }, 
                // { name: 'idle-detection', label: 'Idle Detection', icon: '💤' } 
            ];
            let hasRendered = false;
            for (const perm of permissionsToCheck) {
                try {
                    const status = await navigator.permissions.query({ name: perm.name });
                    this._renderPermissionStatus(grid, perm, status.state, silent && !hasRendered);
                    hasRendered = true; 
                    status.onchange = () => this._renderPermissionStatus(grid, perm, status.state); 
                } catch (e) { 
                    this._renderPermissionStatus(grid, perm, `Error (${e.name})`, silent && !hasRendered);
                    hasRendered = true;
                    console.warn(`Permission query error for ${perm.name}:`, e);
                }
            }
        },
        _renderPermissionStatus(gridEl, perm, state, clearFirst = false) {
            if (clearFirst && gridEl.firstChild && gridEl.firstChild.classList && gridEl.firstChild.classList.contains('placeholder-card')) {
                 gridEl.innerHTML = '';
            }


            let card = gridEl.querySelector(`#perm-${perm.name}`);
            if (!card) {
                card = document.createElement('div');
                card.className = 'info-card';
                card.id = `perm-${perm.name}`;
                gridEl.appendChild(card);
            }
            card.innerHTML = `
                <div class="card-label">${perm.icon || ''} ${perm.label}</div>
                <div class="card-value value-${App.getStatusClass(state)}">${state.charAt(0).toUpperCase() + state.slice(1)}</div>
            `;
        }
    },
    Storage: { 
        init() {
            App.elements.inspectLocalStorageBtn?.addEventListener('click', () => this.inspectStorage('localStorage'));
            App.elements.inspectSessionStorageBtn?.addEventListener('click', () => this.inspectStorage('sessionStorage'));
             this.getGeneralStorageInfo();
        },
        inspectStorage(type) {
            const listId = type === 'localStorage' ? 'localStorageList' : 'sessionStorageList';
            const storage = window[type];
            const container = App.getEl(listId);
            if (!container) { console.warn(`${listId} container not found.`); return; }

            try {
                if (!storage) {
                    App.setHTMLList(listId, [], 'list-item value-warning', `${type} not available.`);
                    return;
                }
                const keys = Object.keys(storage);
                if (keys.length === 0) {
                    App.setHTMLList(listId, [], 'list-item', `No items found in ${type}.`);
                    return;
                }
                const items = keys.map(key => {
                    let value = storage.getItem(key) || "";
                    if (value.length > 70) value = value.substring(0, 70) + "... (truncated)";
                    return `<strong>${key}:</strong> <code>${value}</code>`;
                });
                App.setHTMLList(listId, items, 'list-item');
            } catch (e) {
                App.setHTMLList(listId, [], 'list-item value-error', `Error accessing ${type}: ${e.message}. (Possibly disabled by browser settings or extensions).`);
                console.error(`Error inspecting ${type}:`, e);
            }
        },
        async getGeneralStorageInfo() {
            if (navigator.storage && navigator.storage.estimate) {
              try {
                const est = await navigator.storage.estimate();
                App.setText('storageQuotaVal', est.quota ? `${App.formatBytes(est.quota)} Total Quota` : 'N/A');
                App.setText('storageUsageVal', est.usage ? `${App.formatBytes(est.usage)} Used` : 'N/A');
              } catch (e) {
                App.handleErrorText('storageQuotaVal', 'Storage Est. API Error'); App.handleErrorText('storageUsageVal');
              }
            } else {
                App.handleErrorText('storageQuotaVal', 'Storage Est. API N/A'); App.handleErrorText('storageUsageVal');
            }
        }
    },
    Accessibility: { 
        init() {
            this.checkPreferences();
        },
        checkPreferences() {
            if (window.matchMedia) {
                const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
                App.setText('prefersReducedMotionVal', reducedMotion.matches ? 'Reduce Motion Requested' : 'No Preference / Full Motion',
                    { status: reducedMotion.matches ? 'info' : 'neutral' });
                reducedMotion.onchange = (e) => App.setText('prefersReducedMotionVal', e.matches ? 'Reduce Motion Requested' : 'No Preference / Full Motion', { status: e.matches ? 'info' : 'neutral' });

                const colorSchemeDark = window.matchMedia('(prefers-color-scheme: dark)');
                const colorSchemeLight = window.matchMedia('(prefers-color-scheme: light)');
                let scheme = 'No Preference / Unknown';
                if(colorSchemeDark.matches) scheme = 'Dark Scheme Preferred';
                else if(colorSchemeLight.matches) scheme = 'Light Scheme Preferred';
                App.setText('prefersColorSchemeVal', scheme, { status: 'info' });
                
                colorSchemeDark.addEventListener('change', e => {
                    if(e.matches) App.setText('prefersColorSchemeVal', 'Dark Scheme Preferred', { status: 'info' });
                });
                 colorSchemeLight.addEventListener('change', e => {
                    if(e.matches) App.setText('prefersColorSchemeVal', 'Light Scheme Preferred', { status: 'info' });
                });


            } else {
                App.handleErrorText('prefersReducedMotionVal', 'MatchMedia API N/A');
                App.handleErrorText('prefersColorSchemeVal');
            }
        }
    },
    HDMILimitations: { 
        init() {
            const resEl = App.getEl('currentResolution');
            if (resEl && App.elements.hdmiMaxResolution) {
                App.elements.hdmiMaxResolution.textContent = resEl.textContent || "N/A";
            } else if (App.elements.hdmiMaxResolution){
                 App.elements.hdmiMaxResolution.textContent = `${screen.width} x ${screen.height} (Primary Screen Fallback)`;
            }
             if (App.elements.hdmiEmeHdcpStatusVal) {
                App.Hardware.checkEMEPolicySupport('hdcp', 'hdmiEmeHdcpStatusVal');
             }
        }
    },
     // New Omega Feature Modules (stubs for now, to be expanded)
    PixelTests: {
        init() {
            const pixelTestButtons = document.querySelectorAll('.button-group button[data-color], .button-group button[data-pattern]');
            pixelTestButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const color = e.target.dataset.color;
                    const pattern = e.target.dataset.pattern;
                    this.launchPixelTest(color, pattern);
                });
            });

            App.elements.pixelTestOverlay?.addEventListener('click', () => this.exitPixelTest());
            document.addEventListener('keydown', (e) => {
                if (e.key === "Escape" && App.elements.pixelTestOverlay && App.elements.pixelTestOverlay.style.display === 'block') {
                    this.exitPixelTest();
                }
            });
        },
        launchPixelTest(color, pattern) {
            const overlay = App.elements.pixelTestOverlay;
            if (!overlay) return;
            
            overlay.innerHTML = ''; // Clear previous patterns/colors
            overlay.style.backgroundImage = ''; // Clear background image

            if (color) {
                overlay.style.backgroundColor = color;
            } else if (pattern === 'checker') {
                // Simple CSS checkerboard. More complex patterns might need canvas.
                overlay.style.backgroundColor = 'transparent'; // Ensure background doesn't interfere
                overlay.style.backgroundImage = `
                    linear-gradient(45deg, #808080 25%, transparent 25%), 
                    linear-gradient(-45deg, #808080 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #808080 75%),
                    linear-gradient(-45deg, transparent 75%, #808080 75%)`;
                overlay.style.backgroundSize = `30px 30px`; // Adjust size of checker squares
                overlay.style.backgroundPosition = `0 0, 0 15px, 15px -15px, -15px 0px`;
            }
            
            overlay.style.display = 'block';
            if (overlay.requestFullscreen) {
                overlay.requestFullscreen().catch(err => console.warn("Fullscreen request failed:", err));
            } else if (overlay.webkitRequestFullscreen) { /* Safari */
                overlay.webkitRequestFullscreen();
            }
        },
        exitPixelTest() {
            const overlay = App.elements.pixelTestOverlay;
            if (!overlay) return;
            overlay.style.display = 'none';
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.warn("Exiting fullscreen failed:", err));
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            }
        }
    },
    CVDSimulator: {
        init() {
            App.elements.cvdSimulationSelect?.addEventListener('change', (e) => {
                this.applySimulation(e.target.value);
            });
        },
        applySimulation(type) {
            document.body.classList.remove('cvd-protanopia', 'cvd-deuteranopia', 'cvd-tritanopia', 'cvd-achromatopsia');
            if (type !== 'none') {
                document.body.classList.add(`cvd-${type}`);
            }
        }
    },


    Reporting: { 
      async copyReport() {
        let report = `Inspector Omega - Diagnostic Report\nGenerated: ${new Date().toLocaleString()}\n`;
        report += "============================================\n\n";

        App.elements.navLinks.forEach(navLink => {
            const targetPanelId = navLink.dataset.target;
            const panel = App.getEl(targetPanelId);
            if (!panel) return;

            const panelTitleEl = navLink.querySelector('.link-text');
            const panelTitle = panelTitleEl ? panelTitleEl.textContent.trim() : targetPanelId.replace('-panel','').toUpperCase();
            report += `--- ${panelTitle} SECTION ---\n`;

            panel.querySelectorAll('.info-card').forEach(card => {
                const labelEl = card.querySelector('.card-label');
                const valueEl = card.querySelector('.card-value');
                const descEl = card.querySelector('.card-description');
                const listContainer = card.querySelector('.list-display-container');

                let cardReport = `  ${labelEl ? labelEl.textContent.replace(/\s\s+/g, ' ').trim() : 'Info:'}`;
                if (valueEl && valueEl.textContent.trim() !== '-' && valueEl.textContent.trim() !== 'N/A' && !valueEl.classList.contains('placeholder-card')) { // Exclude placeholder
                     if (valueEl.classList.contains('code-text')) {
                        cardReport += `\n    ${valueEl.textContent.trim().split('\n').map(line => line.trim()).join('\n    ')}`;
                    } else {
                        cardReport += ` ${valueEl.textContent.replace(/\s\s+/g, ' ').trim()}`;
                    }
                }

                if (descEl && descEl.offsetParent !== null) { 
                  cardReport += `\n    (${descEl.textContent.replace(/\s\s+/g, ' ').trim()})`;
                }
                // Only add card report if it has more than just the label
                if (cardReport.replace(`  ${labelEl ? labelEl.textContent.replace(/\s\s+/g, ' ').trim() : 'Info:'}`, '').trim().length > 0) {
                    report += cardReport + '\n';
                }


                if (listContainer && listContainer.offsetParent !== null) { 
                    const items = listContainer.querySelectorAll('.list-item');
                    if (items.length > 0 && !items[0].textContent.toLowerCase().includes('click') && !items[0].textContent.toLowerCase().includes('querying') && !items[0].textContent.toLowerCase().includes('scan')) {
                         items.forEach(item => {
                            report += `    - ${item.textContent.replace(/<[^>]*>/g, " ").replace(/\s\s+/g, ' ').trim()}\n`;
                        });
                    }
                }
                 // Special handling for webgl extensions list which is directly in a card-value.code-text
                if (card.querySelector('#webGlExtensionsList') && card.querySelector('#webGlExtensionsList').textContent.trim().toLowerCase() !== 'click "load extensions" to query.') {
                    const extensionsText = card.querySelector('#webGlExtensionsList').textContent.trim();
                    if (extensionsText && !extensionsText.toLowerCase().includes('click')) {
                        report += `    Extensions:\n    ${extensionsText.split('\n').map(line => `  ${line.trim()}`).join('\n    ')}\n`;
                    }
                }
            });
            report += "\n";
        });
        report += "============================================\n";
        report += "/!\\ Accuracy based on Browser APIs. Low-level hardware details are not directly accessible.\n";

        try {
          await navigator.clipboard.writeText(report);
          if(App.elements.copyReportBtn) App.Tooltips.updateAndShow(App.elements.copyReportBtn, "Report Copied to Clipboard!");
        } catch (e) {
          console.error('Failed to copy report:', e);
          if(App.elements.copyReportBtn) App.Tooltips.updateAndShow(App.elements.copyReportBtn, "Copy Failed! (See Console for Report)", 3000);
          console.log("--- BEGIN DIAGNOSTIC REPORT ---\n", report, "\n--- END DIAGNOSTIC REPORT ---");
        }
      }
    },

  }; 
  App.init();
});
