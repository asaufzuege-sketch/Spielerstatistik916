// Goal Map Modul
App.goalMap = {
  timeTrackingBox: null,
  playerFilter: null,
  
  init() {
    this.timeTrackingBox = document.getElementById("timeTrackingBox");
    
    // Event Listeners
    document.getElementById("exportGoalMapBtn")?.addEventListener("click", () => {
      this.exportGoalMap();
    });
    
    document.getElementById("resetGoalMapBtn")?.addEventListener("click", () => {
      this.reset();
    });
    
    // Initialize interactive boxes (Feld + Tore)
    this.initBoxes();
    
    // Initialize time tracking
    this.initTimeTracking();
    
    // Initialize player filter
    this.initPlayerFilter();
  },
  
  initBoxes() {
    const boxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
    
    boxes.forEach((box) => {
      const img = box.querySelector("img");
      if (!img) return;
      
      box.style.position = box.style.position || "relative";
      App.markerHandler.createImageSampler(img);
      
      let mouseHoldTimer = null;
      let isLong = false;
      let lastMouseUp = 0;
      let lastTouchEnd = 0;
      
      const getPosFromEvent = (e) => {
        const boxRect = img.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches?.[0]?.clientX);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches?.[0]?.clientY);
        
        const xPctContainer = Math.max(0, Math.min(1, (clientX - boxRect.left) / (boxRect.width || 1))) * 100;
        const yPctContainer = Math.max(0, Math.min(1, (clientY - boxRect.top) / (boxRect.height || 1))) * 100;
        
        const rendered = App.markerHandler.computeRenderedImageRect(img);
        let insideImage = false;
        let xPctImage = 0;
        let yPctImage = 0;
        
        if (rendered) {
          insideImage = (clientX >= rendered.x && clientX <= rendered.x + rendered.width && 
                        clientY >= rendered.y && clientY <= rendered.y + rendered.height);
          if (insideImage) {
            xPctImage = Math.max(0, Math.min(1, (clientX - rendered.x) / (rendered.width || 1))) * 100;
            yPctImage = Math.max(0, Math.min(1, (clientY - rendered.y) / (rendered.height || 1))) * 100;
          }
        } else {
          insideImage = true;
          xPctImage = xPctContainer;
          yPctContainer = yPctContainer;
        }
        
        return { xPctContainer, yPctContainer, xPctImage, yPctImage, insideImage };
      };
      
      const placeMarker = (pos, long, forceGrey = false) => {
        // Spielername aus Filter oder Workflow
        const playerName = this.playerFilter || (App.goalMapWorkflow.active ? App.goalMapWorkflow.playerName : null);
        
        if (box.classList.contains("field-box")) {
          if (!pos.insideImage) return;
          
          const sampler = App.markerHandler.createImageSampler(img);
          
          // Langer Klick oder Doppelklick = GRAUER PUNKT (Tor)
          if (long || forceGrey) {
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#808080", box, true, playerName);
            
            // Add workflow point if active
            if (App.goalMapWorkflow.active) {
              App.addGoalMapPoint('field', pos.xPctContainer, pos.yPctContainer, '#808080', box.id);
            }
            return;
          }
          
          // Normaler Klick = GRÜNER PUNKT (Schuss)
          // Mit intelligenter Farberkennung basierend auf Bildbereich
          if (sampler && sampler.valid) {
            const isGreen = sampler.isGreenAt(pos.xPctImage, pos.yPctImage, 110, 30);
            const isRed = sampler.isRedAt(pos.xPctImage, pos.yPctImage, 95, 22);
            
            let color = "#00ff00"; // Standard: Grün für Schuss
            
            // Optional: Farbe anpassen basierend auf Spielfeld-Bereich
            if (isGreen) {
              color = "#00ff66";  // Helleres Grün auf grünem Bereich
            } else if (isRed) {
              color = "#ff0000";  // Rot auf rotem Bereich (defensive Zone)
            }
            
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, color, box, true, playerName);
            
            // Add workflow point if active
            if (App.goalMapWorkflow.active) {
              App.addGoalMapPoint('field', pos.xPctContainer, pos.yPctContainer, color, box.id);
            }
          } else {
            // Fallback wenn keine Bilderkennung möglich
            const color = "#00ff00"; // Grün für Schuss
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, color, box, true, playerName);
            
            if (App.goalMapWorkflow.active) {
              App.addGoalMapPoint('field', pos.xPctContainer, pos.yPctContainer, color, box.id);
            }
          }
        } else if (box.classList.contains("goal-img-box") || box.id === "goalGreenBox" || box.id === "goalRedBox") {
          // Tor-Boxen: Nur auf weißem Bereich platzieren
          const sampler = App.markerHandler.createImageSampler(img);
          if (!sampler || !sampler.valid) return;
          
          if (box.id === "goalGreenBox") {
            if (!sampler.isWhiteAt(pos.xPctContainer, pos.yPctContainer, 220)) return;
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#808080", box, true, playerName);
            
            if (App.goalMapWorkflow.active) {
              App.addGoalMapPoint('goal', pos.xPctContainer, pos.yPctContainer, '#808080', box.id);
            }
          } else if (box.id === "goalRedBox") {
            if (!sampler.isNeutralWhiteAt(pos.xPctContainer, pos.yPctContainer, 235, 12)) return;
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#808080", box, true, playerName);
            
            if (App.goalMapWorkflow.active) {
              App.addGoalMapPoint('goal', pos.xPctContainer, pos.yPctContainer, '#808080', box.id);
            }
          } else {
            if (!sampler.isWhiteAt(pos.xPctContainer, pos.yPctContainer, 220)) return;
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#808080", box, true, playerName);
            
            if (App.goalMapWorkflow.active) {
              App.addGoalMapPoint('goal', pos.xPctContainer, pos.yPctContainer, '#808080', box.id);
            }
          }
        }
      };
      
      // MOUSE EVENTS
      img.addEventListener("mousedown", (ev) => {
        isLong = false;
        if (mouseHoldTimer) clearTimeout(mouseHoldTimer);
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          placeMarker(getPosFromEvent(ev), true);  // Langer Klick = grauer Punkt
        }, 600); // 600ms für langen Klick
      });
      
      img.addEventListener("mouseup", (ev) => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        const now = Date.now();
        const pos = getPosFromEvent(ev);
        
        // Doppelklick-Erkennung
        if (now - lastMouseUp < 300) {
          placeMarker(pos, true, true);  // Doppelklick = grauer Punkt
          lastMouseUp = 0;
        } else {
          if (!isLong) placeMarker(pos, false);  // Normaler Klick = grüner Punkt
          lastMouseUp = now;
        }
        isLong = false;
      });
      
      img.addEventListener("mouseleave", () => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        isLong = false;
      });
      
      // TOUCH EVENTS
      img.addEventListener("touchstart", (ev) => {
        isLong = false;
        if (mouseHoldTimer) clearTimeout(mouseHoldTimer);
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          placeMarker(getPosFromEvent(ev.touches[0]), true);  // Langer Touch = grauer Punkt
          
          // Haptic feedback für langen Touch
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, 600);
      }, { passive: true });
      
      img.addEventListener("touchend", (ev) => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        const now = Date.now();
        const pos = getPosFromEvent(ev.changedTouches[0]);
        
        // Doppel-Touch-Erkennung
        if (now - lastTouchEnd < 300) {
          placeMarker(pos, true, true);  // Doppel-Touch = grauer Punkt
          lastTouchEnd = 0;
        } else {
          if (!isLong) placeMarker(pos, false);  // Normaler Touch = grüner Punkt
          lastTouchEnd = now;
        }
        isLong = false;
      }, { passive: true });
      
      img.addEventListener("touchcancel", () => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        isLong = false;
      }, { passive: true });
    });
  },
  
  initTimeTracking() {
    // 0. Grundcheck: Box vorhanden?
    this.timeTrackingBox = this.timeTrackingBox || document.getElementById("timeTrackingBox");
    if (!this.timeTrackingBox) {
      console.warn("[Goal Map] timeTrackingBox not found – no time tracking initialized");
      return;
    }
    
    console.log("[Goal Map] Initializing time tracking...");
    
    // 1. Bestehende Daten defensiv laden
    let timeDataWithPlayers = {};
    try {
      const stored = localStorage.getItem("timeDataWithPlayers");
      if (stored) {
        timeDataWithPlayers = JSON.parse(stored);
        if (typeof timeDataWithPlayers !== "object" || timeDataWithPlayers === null) {
          console.warn("[Goal Map] timeDataWithPlayers is not an object, resetting");
          timeDataWithPlayers = {};
        }
      }
    } catch (e) {
      console.warn("[Goal Map] Failed to load timeDataWithPlayers, resetting:", e);
      timeDataWithPlayers = {};
    }
    
    const periods = this.timeTrackingBox.querySelectorAll(".period");
    if (!periods.length) {
      console.warn("[Goal Map] No .period elements found inside timeTrackingBox");
    }
    
    periods.forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `p${pIdx}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      console.log(`[Goal Map] Processing period ${periodNum} with ${buttons.length} buttons`);
      
      if (!buttons.length) {
        console.warn(`[Goal Map] No .time-btn found in period ${periodNum}`);
      }
      
      buttons.forEach((btn, idx) => {
        const key = `${periodNum}_${idx}`;
        
        // Falls ein geklonter Button mit altem data-listener-attached da ist: entfernen
        if (!btn._goalMapClickBound && btn.hasAttribute('data-listener-attached') && !btn.onclick) {
          btn.removeAttribute('data-listener-attached');
        }
        
        // 2. INITIALEN WERT SETZEN
        const playerData = timeDataWithPlayers[key] || {};
        let total = 0;
        Object.values(playerData).forEach(count => total += Number(count) || 0);
        btn.textContent = total;
        
        console.log(`[Goal Map] Button ${key} initial value: ${total}`);
        
        // 3. EVENT LISTENER NUR EINMAL HINZUFÜGEN
        if (btn._goalMapClickBound) {
          console.log(`[Goal Map] Button ${key} already has click handler, skipping`);
          return;
        }
        btn._goalMapClickBound = true;
        btn.setAttribute('data-listener-attached', 'true');
        
        // Click / Double-Click Unterscheidung wie in 912
        let lastTap = 0;
        let clickTimeout = null;
        let touchStart = 0;
        
        const updateValue = (delta) => {
          try {
            console.log(`[Goal Map] Button ${key} update, delta=${delta}`);
            
            // Daten IMMER frisch laden
            let currentData = {};
            try {
              const stored = localStorage.getItem("timeDataWithPlayers");
              if (stored) {
                currentData = JSON.parse(stored);
                if (typeof currentData !== "object" || currentData === null) {
                  currentData = {};
                }
              }
            } catch (e2) {
              currentData = {};
            }
            
            if (!currentData[key]) currentData[key] = {};
            
            // SPIELER-LOGIK:
            const playerName =
              this.playerFilter || (App.goalMapWorkflow.active ? App.goalMapWorkflow.playerName : '_anonymous');
            
            if (!currentData[key][playerName]) currentData[key][playerName] = 0;
            
            const oldValue = Number(currentData[key][playerName]) || 0;
            const newValue = Math.max(0, oldValue + delta);
            currentData[key][playerName] = newValue;
            
            console.log(`[Goal Map] Updated ${playerName} for ${key}: ${oldValue} -> ${newValue}`);
            
            // Speichern
            localStorage.setItem("timeDataWithPlayers", JSON.stringify(currentData));
            
            // Anzeige Update
            const currentPlayerMap = currentData[key] || {};
            let displayVal = 0;
            
            if (this.playerFilter) {
              displayVal = Number(currentPlayerMap[this.playerFilter]) || 0;
            } else {
              displayVal = Object.values(currentPlayerMap).reduce((a, b) => a + (Number(b) || 0), 0);
            }
            
            btn.textContent = displayVal;
            
            // Workflow Point nur bei +1 und aktivem Workflow
            if (delta > 0 && App.goalMapWorkflow && App.goalMapWorkflow.active) {
              try {
                const btnRect = btn.getBoundingClientRect();
                const boxRect = this.timeTrackingBox.getBoundingClientRect();
                const xPct = ((btnRect.left + btnRect.width / 2 - boxRect.left) / boxRect.width) * 100;
                const yPct = ((btnRect.top + btnRect.height / 2 - boxRect.top) / boxRect.height) * 100;
                
                App.addGoalMapPoint('time', xPct, yPct, '#888888', 'timeTrackingBox');
                console.log(`[Goal Map] Workflow point added at ${xPct.toFixed(1)}%, ${yPct.toFixed(1)}%`);
              } catch (e4) {
                console.warn("[Goal Map] Failed to add workflow point:", e4);
              }
            }
          } catch (err) {
            console.error("[Goal Map] updateValue failed for key", key, err);
          }
        };
        
        // MOUSE CLICK
        btn.addEventListener("click", () => {
          const now = Date.now();
          const diff = now - lastTap;
          if (diff < 300) {
            if (clickTimeout) {
              clearTimeout(clickTimeout);
              clickTimeout = null;
            }
            updateValue(-1);  // Doppelklick: -1
            lastTap = 0;
          } else {
            clickTimeout = setTimeout(() => {
              updateValue(+1);  // Einzelklick: +1
              clickTimeout = null;
            }, 300);
            lastTap = now;
          }
        });
        
        // TOUCH (für mobile Geräte)
        btn.addEventListener("touchstart", (e) => {
          const now = Date.now();
          const diff = now - touchStart;
          if (diff < 300) {
            e.preventDefault();
            if (clickTimeout) {
              clearTimeout(clickTimeout);
              clickTimeout = null;
            }
            updateValue(-1);  // Doppel-Touch: -1
            touchStart = 0;
          } else {
            touchStart = now;
            setTimeout(() => {
              if (touchStart !== 0) {
                updateValue(+1);  // Single-Touch: +1
                touchStart = 0;
              }
            }, 300);
          }
        }, { passive: true });
        
        console.log(`[Goal Map] Click/touch listener attached to button ${key}`);
      });
    });
    
    // Filter anwenden, falls einer aktiv ist
    if (this.playerFilter) {
      this.applyTimeTrackingFilter();
    }
    
    console.log("[Goal Map] Time tracking initialization complete");
  },
  
  initPlayerFilter() {
    const filterSelect = document.getElementById("goalMapPlayerFilter");
    if (!filterSelect) return;
    
    // Populate dropdown with players
    filterSelect.innerHTML = '<option value="">Alle Spieler</option>';
    App.data.selectedPlayers.forEach(player => {
      const option = document.createElement("option");
      option.value = player.name;
      option.textContent = player.name;
      filterSelect.appendChild(option);
    });
    
    // Add change event listener
    filterSelect.addEventListener("change", () => {
      this.playerFilter = filterSelect.value || null;
      this.applyPlayerFilter();
    });
    
    // Restore filter from localStorage
    const savedFilter = localStorage.getItem("goalMapPlayerFilter");
    if (savedFilter) {
      filterSelect.value = savedFilter;
      this.playerFilter = savedFilter;
      this.applyPlayerFilter();
    }
  },
  
  applyPlayerFilter() {
    // Save filter to localStorage
    if (this.playerFilter) {
      localStorage.setItem("goalMapPlayerFilter", this.playerFilter);
    } else {
      localStorage.removeItem("goalMapPlayerFilter");
    }
    
    // Filter markers in field and goal boxes
    const boxes = document.querySelectorAll(App.selectors.torbildBoxes);
    boxes.forEach(box => {
      const markers = box.querySelectorAll(".marker-dot");
      markers.forEach(marker => {
        if (this.playerFilter) {
          marker.style.display = (marker.dataset.player === this.playerFilter) ? '' : 'none';
        } else {
          marker.style.display = '';
        }
      });
    });
    
    // Update timebox display with player filter
    this.applyTimeTrackingFilter();
    
    console.log(`Goal Map player filter applied: ${this.playerFilter || 'All players'}`);
  },
  
  applyTimeTrackingFilter() {
    if (!this.timeTrackingBox) return;
    
    let timeDataWithPlayers = {};
    try {
      timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
      if (typeof timeDataWithPlayers !== "object" || timeDataWithPlayers === null) {
        timeDataWithPlayers = {};
      }
    } catch {
      timeDataWithPlayers = {};
    }
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `p${pIdx}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        const key = `${periodNum}_${idx}`;
        const playerData = timeDataWithPlayers[key] || {};
        
        let displayVal = 0;
        if (this.playerFilter) {
          displayVal = Number(playerData[this.playerFilter]) || 0;
        } else {
          displayVal = Object.values(playerData).reduce((sum, val) => sum + (Number(val) || 0), 0);
        }
        
        btn.textContent = displayVal;
      });
    });
  },
  
  updateWorkflowIndicator() {
    const indicator = document.getElementById("goalMapWorkflowIndicator");
    if (!indicator) return;
    
    if (App.goalMapWorkflow.active) {
      const collected = App.goalMapWorkflow.collectedPoints.length;
      const required = App.goalMapWorkflow.requiredPoints;
      const eventType = App.goalMapWorkflow.eventType;
      const playerName = App.goalMapWorkflow.playerName;
      
      indicator.style.display = 'block';
      indicator.innerHTML = `
        <div class="workflow-info">
          <strong>${eventType.toUpperCase()} - ${playerName}</strong><br>
          Punkte: ${collected}/${required}
          ${eventType === 'goal' ? '<br>1. Feld, 2. Tor, 3. Zeit' : '<br>1. Feld klicken'}
        </div>
      `;
    } else {
      indicator.style.display = 'none';
    }
  },
  
  exportGoalMap() {
    // Export markers
    const boxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
    const allMarkers = boxes.map(box => {
      const markers = [];
      box.querySelectorAll(".marker-dot").forEach(dot => {
        const left = dot.style.left || "";
        const top = dot.style.top || "";
        const bg = dot.style.backgroundColor || "";
        const xPct = parseFloat(left.replace("%", "")) || 0;
        const yPct = parseFloat(top.replace("%", "")) || 0;
        const playerName = dot.dataset.player || null;
        markers.push({ xPct, yPct, color: bg, player: playerName });
      });
      return markers;
    });
    
    localStorage.setItem("goalMapMarkers", JSON.stringify(allMarkers));
    
    // Export time data
    const timeData = this.readTimeTrackingFromBox();
    localStorage.setItem("timeData", JSON.stringify(timeData));
    
    alert("Goal Map Daten exportiert!");
  },
  
  readTimeTrackingFromBox() {
    const result = {};
    if (!this.timeTrackingBox) return result;
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const key = period.dataset.period || (`p${pIdx}`);
      result[key] = [];
      period.querySelectorAll(".time-btn").forEach(btn => {
        result[key].push(Number(btn.textContent) || 0);
      });
    });
    return result;
  },
  
  reset() {
    if (!confirm("⚠️ Goal Map zurücksetzen (Marker + Timeboxen)?")) return;
    
    // Nur Goal-Map-Marker & -Timeboxen zurücksetzen
    document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
    document.querySelectorAll("#torbildPage .time-btn").forEach(btn => btn.textContent = "0");
    
    // Nur Goal-Map-Keys löschen, Season-Map-Keys bleiben unberührt
    localStorage.removeItem("timeData");
    localStorage.removeItem("timeDataWithPlayers");
    localStorage.removeItem("goalMapMarkers");
    
    alert("Goal Map zurückgesetzt.");
  }
};
