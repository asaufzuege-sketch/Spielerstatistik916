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
    
    // Marker Handler für Goal Map Boxen - EXAKT WIE IN 912
    this.attachMarkerHandlers();
    
    // Time Tracking initialisieren
    this.initTimeTracking();
    
    // Initialize player filter
    this.initPlayerFilter();
  },
  
  attachMarkerHandlers() {
    const boxes = document.querySelectorAll(App.selectors.torbildBoxes);
    
    boxes.forEach(box => {
      const img = box.querySelector("img");
      if (!img) return;
      
      box.style.position = box.style.position || "relative";
      
      let mouseHoldTimer = null;
      let isLong = false;
      
      // MOUSE EVENTS - DIREKT AUF IMG WIE IN 912
      img.addEventListener("mousedown", (ev) => {
        isLong = false;
        if (mouseHoldTimer) clearTimeout(mouseHoldTimer);
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          
          // LANGER KLICK = GRAUER PUNKT
          const rect = img.getBoundingClientRect();
          const x = ev.clientX - rect.left;
          const y = ev.clientY - rect.top;
          const xPct = (x / rect.width) * 100;
          const yPct = (y / rect.height) * 100;
          
          const playerName = this.playerFilter || (App.goalMapWorkflow?.active ? App.goalMapWorkflow.playerName : null);
          App.markerHandler.createMarkerPercent(xPct, yPct, "#808080", box, true, playerName);
          
          // Workflow integration
          if (App.goalMapWorkflow?.active) {
            const boxType = box.classList.contains('goal-img-box') ? 'goal' : 'field';
            App.addGoalMapPoint(boxType, xPct, yPct, '#808080', box.id);
          }
        }, 600); // 600ms wie in 912
      });
      
      img.addEventListener("mouseup", (ev) => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        
        if (!isLong) {
          // NORMALER KLICK = GRÜNER PUNKT
          const rect = img.getBoundingClientRect();
          const x = ev.clientX - rect.left;
          const y = ev.clientY - rect.top;
          const xPct = (x / rect.width) * 100;
          const yPct = (y / rect.height) * 100;
          
          const playerName = this.playerFilter || (App.goalMapWorkflow?.active ? App.goalMapWorkflow.playerName : null);
          App.markerHandler.createMarkerPercent(xPct, yPct, "#00ff00", box, true, playerName);
          
          // Workflow integration
          if (App.goalMapWorkflow?.active) {
            const boxType = box.classList.contains('goal-img-box') ? 'goal' : 'field';
            App.addGoalMapPoint(boxType, xPct, yPct, '#00ff00', box.id);
          }
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
      
      // TOUCH EVENTS - DIREKT AUF IMG WIE IN 912
      img.addEventListener("touchstart", (ev) => {
        isLong = false;
        if (mouseHoldTimer) clearTimeout(mouseHoldTimer);
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          
          // LANGER TOUCH = GRAUER PUNKT
          const touch = ev.touches[0];
          const rect = img.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          const xPct = (x / rect.width) * 100;
          const yPct = (y / rect.height) * 100;
          
          const playerName = this.playerFilter || (App.goalMapWorkflow?.active ? App.goalMapWorkflow.playerName : null);
          App.markerHandler.createMarkerPercent(xPct, yPct, "#808080", box, true, playerName);
          
          // Workflow integration
          if (App.goalMapWorkflow?.active) {
            const boxType = box.classList.contains('goal-img-box') ? 'goal' : 'field';
            App.addGoalMapPoint(boxType, xPct, yPct, '#808080', box.id);
          }
          
          // Haptic feedback
          if (navigator.vibrate) navigator.vibrate(50);
        }, 600);
      }, { passive: true });
      
      img.addEventListener("touchend", (ev) => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        
        if (!isLong && ev.changedTouches.length > 0) {
          // NORMALER TOUCH = GRÜNER PUNKT
          const touch = ev.changedTouches[0];
          const rect = img.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          const xPct = (x / rect.width) * 100;
          const yPct = (y / rect.height) * 100;
          
          const playerName = this.playerFilter || (App.goalMapWorkflow?.active ? App.goalMapWorkflow.playerName : null);
          App.markerHandler.createMarkerPercent(xPct, yPct, "#00ff00", box, true, playerName);
          
          // Workflow integration
          if (App.goalMapWorkflow?.active) {
            const boxType = box.classList.contains('goal-img-box') ? 'goal' : 'field';
            App.addGoalMapPoint(boxType, xPct, yPct, '#00ff00', box.id);
          }
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
    if (!this.timeTrackingBox) return;
    
    // TIME DATA AUS 912 ÜBERNEHMEN
    let timeData = JSON.parse(localStorage.getItem("timeData")) || {};
    let timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
    
    this.timeTrackingBox.querySelectorAll(".period").forEach(period => {
      const periodNum = period.dataset.period || Math.random().toString(36).slice(2, 6);
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        // Initialisierung aus timeDataWithPlayers oder timeData
        const key = `${periodNum}_${idx}`;
        let displayValue = 0;
        
        if (timeDataWithPlayers[key]) {
          // Summe aller Spieler
          displayValue = Object.values(timeDataWithPlayers[key]).reduce((sum, val) => sum + Number(val), 0);
        } else if (timeData[periodNum] && typeof timeData[periodNum][idx] !== "undefined") {
          displayValue = Number(timeData[periodNum][idx]);
        } else {
          displayValue = Number(btn.textContent) || 0;
        }
        
        btn.textContent = displayValue;
        
        // KLICK-HANDLER WIE IN 912
        let lastTap = 0;
        let clickTimeout = null;
        
        const updateValue = (delta) => {
          // Player-spezifisches Update
          const playerName = this.playerFilter || (App.goalMapWorkflow?.active ? App.goalMapWorkflow.playerName : '_anonymous');
          
          if (!timeDataWithPlayers[key]) timeDataWithPlayers[key] = {};
          if (!timeDataWithPlayers[key][playerName]) timeDataWithPlayers[key][playerName] = 0;
          
          const current = Number(timeDataWithPlayers[key][playerName]);
          const newVal = Math.max(0, current + delta);
          timeDataWithPlayers[key][playerName] = newVal;
          
          // Speichern
          localStorage.setItem("timeDataWithPlayers", JSON.stringify(timeDataWithPlayers));
          
          // Display update
          let displayVal = 0;
          if (this.playerFilter) {
            displayVal = timeDataWithPlayers[key][this.playerFilter] || 0;
          } else {
            displayVal = Object.values(timeDataWithPlayers[key]).reduce((sum, val) => sum + Number(val), 0);
          }
          btn.textContent = displayVal;
          
          // Legacy timeData update für Kompatibilität
          if (!timeData[periodNum]) timeData[periodNum] = {};
          timeData[periodNum][idx] = displayVal;
          localStorage.setItem("timeData", JSON.stringify(timeData));
          
          // Workflow point
          if (delta > 0 && App.goalMapWorkflow?.active) {
            const btnRect = btn.getBoundingClientRect();
            const boxRect = this.timeTrackingBox.getBoundingClientRect();
            const xPct = ((btnRect.left + btnRect.width / 2 - boxRect.left) / boxRect.width) * 100;
            const yPct = ((btnRect.top + btnRect.height / 2 - boxRect.top) / boxRect.height) * 100;
            App.addGoalMapPoint('time', xPct, yPct, '#888888', 'timeTrackingBox');
          }
        };
        
        btn.addEventListener("click", () => {
          const now = Date.now();
          const diff = now - lastTap;
          if (diff < 300) {
            // Doppelklick
            if (clickTimeout) {
              clearTimeout(clickTimeout);
              clickTimeout = null;
            }
            updateValue(-1);
            lastTap = 0;
          } else {
            // Einzelklick
            clickTimeout = setTimeout(() => {
              updateValue(+1);
              clickTimeout = null;
            }, 300);
            lastTap = now;
          }
        });
      });
    });
    
    // Filter anwenden falls aktiv
    if (this.playerFilter) {
      this.applyTimeTrackingFilter();
    }
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
    
    if (App.goalMapWorkflow?.active) {
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
    if (!confirm("Goal Map zurücksetzen?")) return;
    
    document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
    document.querySelectorAll("#torbildPage .time-btn").forEach(b => b.textContent = "0");
    localStorage.removeItem("timeData");
    localStorage.removeItem("timeDataWithPlayers");
    localStorage.removeItem("goalMapMarkers");
    
    alert("Goal Map zurückgesetzt.");
  }
};
