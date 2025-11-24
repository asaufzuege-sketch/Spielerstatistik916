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
    
    // Initialize interactive boxes
    this.initBoxes();
    
    // Initialize time tracking
    this.initTimeTracking();
    
    // Initialize player filter
    this.initPlayerFilter();
  },
  
  initBoxes() {
    const boxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
    
    boxes.forEach((box) => {
      let longPressTimer = null;
      let longPressActive = false;
      
      const handleInteraction = (e) => {
        if (longPressActive) return;
        
        const rect = App.markerHandler.computeRenderedImageRect(box.querySelector('img'));
        if (!rect) return;
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        const x = clientX - rect.x;
        const y = clientY - rect.y;
        const xPct = App.markerHandler.clampPct((x / rect.width) * 100);
        const yPct = App.markerHandler.clampPct((y / rect.height) * 100);
        
        const img = box.querySelector('img');
        if (!img) return;
        
        const sampler = App.markerHandler.createImageSampler(img);
        let color = "#444444";
        
        if (sampler?.isGreenAt(xPct, yPct)) {
          color = "#00ff00";
        } else if (sampler?.isRedAt(xPct, yPct)) {
          color = "#ff0000";
        } else if (sampler?.isNeutralWhiteAt(xPct, yPct)) {
          color = "#ffffff";
        }
        
        const playerName = App.goalMapWorkflow.active ? App.goalMapWorkflow.playerName : null;
        App.markerHandler.createMarkerPercent(xPct, yPct, color, box, true, playerName);
        
        // Add workflow point if workflow is active
        if (App.goalMapWorkflow.active) {
          App.addGoalMapPoint('field', xPct, yPct, color, box.id);
        }
      };
      
      const startLongPress = () => {
        longPressActive = false;
        longPressTimer = setTimeout(() => {
          longPressActive = true;
          // Long press action - clear markers
          box.querySelectorAll('.marker-dot').forEach(dot => dot.remove());
          
          // Haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        }, 800);
      };
      
      const cancelLongPress = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      };
      
      // Mouse events
      box.addEventListener("mousedown", startLongPress);
      box.addEventListener("mouseup", cancelLongPress);
      box.addEventListener("mouseleave", cancelLongPress);
      box.addEventListener("click", handleInteraction);
      
      // Touch events
      box.addEventListener("touchstart", startLongPress, { passive: true });
      box.addEventListener("touchend", (e) => {
        cancelLongPress();
        if (!longPressActive) {
          handleInteraction(e);
        }
      }, { passive: true });
      box.addEventListener("touchcancel", cancelLongPress, { passive: true });
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
        
        const handleIncrement = (e) => {
          try {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`[Goal Map] Button ${key} clicked`);
            
            // Daten IMMER frisch laden
            let currentData = {};
            try {
              const stored = localStorage.getItem("timeDataWithPlayers");
              if (stored) {
                currentData = JSON.parse(stored);
                if (typeof currentData !== "object" || currentData === null) {
                  console.warn("[Goal Map] current timeDataWithPlayers invalid, resetting");
                  currentData = {};
                }
              }
            } catch (e2) {
              console.warn("[Goal Map] Failed to parse timeDataWithPlayers on click, resetting:", e2);
              currentData = {};
            }
            
            if (!currentData[key]) currentData[key] = {};
            
            // SPIELER-LOGIK:
            // 1. Wenn Filter aktiv → Klick zählt für gefilterten Spieler
            // 2. sonst, wenn Workflow aktiv → Spieler aus Workflow
            // 3. sonst '_anonymous'
            const playerName =
              this.playerFilter || (App.goalMapWorkflow.active ? App.goalMapWorkflow.playerName : '_anonymous');
            
            if (!currentData[key][playerName]) currentData[key][playerName] = 0;
            
            const oldValue = Number(currentData[key][playerName]) || 0;
            currentData[key][playerName] = oldValue + 1;
            
            console.log(`[Goal Map] Incremented ${playerName} for ${key}: ${oldValue} -> ${currentData[key][playerName]}`);
            
            // Speichern
            try {
              localStorage.setItem("timeDataWithPlayers", JSON.stringify(currentData));
            } catch (e3) {
              console.error("[Goal Map] Failed to save timeDataWithPlayers:", e3);
            }
            
            // Anzeige Update (Filter beachten)
            const currentPlayerMap = currentData[key] || {};
            let displayVal = 0;
            
            if (this.playerFilter) {
              // Nur der aktuell gefilterte Spieler
              displayVal = Number(currentPlayerMap[this.playerFilter]) || 0;
            } else {
              // Summe über alle Spieler (inkl. _anonymous)
              displayVal = Object.values(currentPlayerMap).reduce((a, b) => a + (Number(b) || 0), 0);
            }
            
            btn.textContent = displayVal;
            console.log(`[Goal Map] Display value updated to: ${displayVal}`);
            
            // Workflow Point
            if (App.goalMapWorkflow && App.goalMapWorkflow.active) {
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
            console.error("[Goal Map] handleIncrement failed for key", key, err);
          }
        };
        
        btn.addEventListener("click", handleIncrement);
        console.log(`[Goal Map] Click listener attached to button ${key}`);
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
          if (marker.dataset.player === this.playerFilter) {
            marker.style.display = '';
          } else {
            marker.style.display = 'none';
          }
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
    
    document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
    
    document.querySelectorAll("#torbildPage .time-btn").forEach(btn => btn.textContent = "0");
    localStorage.removeItem("timeData");
    localStorage.removeItem("timeDataWithPlayers");
    localStorage.removeItem("goalMapMarkers");
    
    alert("Goal Map zurückgesetzt.");
  }
};
