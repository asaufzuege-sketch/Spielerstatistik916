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
    
    boxes.forEach((box, boxIndex) => {
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
      
      const startLongPress = (e) => {
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
    if (!this.timeTrackingBox) return;
    
    // 1. Bestehende Daten laden
    let timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      // WICHTIG: Konstante Keys verwenden, kein Random!
      const periodNum = period.dataset.period || `p${pIdx}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        const key = `${periodNum}_${idx}`;
        
        // 2. INITIALEN WERT SETZEN
        const playerData = timeDataWithPlayers[key] || {};
        let total = 0;
        Object.values(playerData).forEach(count => total += count);
        btn.textContent = total;
        
        // 3. EVENT LISTENER NUR EINMAL HINZUFÜGEN
        // Check if listener already attached
        if (btn.hasAttribute('data-listener-attached')) {
          return; // Skip if already has listener
        }
        btn.setAttribute('data-listener-attached', 'true');
        
        // Vereinfachter Click Handler - nur ein Event!
        const handleIncrement = (e) => {
          e.preventDefault();
          
          // Daten IMMER frisch laden
          let currentData = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
          
          if (!currentData[key]) currentData[key] = {};
          
          const playerName = App.goalMapWorkflow.active ? App.goalMapWorkflow.playerName : '_anonymous';
          
          if (!currentData[key][playerName]) currentData[key][playerName] = 0;
          
          // +1 Increment
          currentData[key][playerName] = currentData[key][playerName] + 1;
          
          // Speichern
          localStorage.setItem("timeDataWithPlayers", JSON.stringify(currentData));
          
          // Anzeige Update (Filter beachten)
          const currentPlayerMap = currentData[key];
          let displayVal = 0;
          
          if (App.goalMap.playerFilter) {
            displayVal = currentPlayerMap[App.goalMap.playerFilter] || 0;
          } else {
            displayVal = Object.values(currentPlayerMap).reduce((a, b) => a + b, 0);
          }
          btn.textContent = displayVal;
          
          // Workflow Point
          if (App.goalMapWorkflow.active) {
            const btnRect = btn.getBoundingClientRect();
            const boxRect = App.goalMap.timeTrackingBox.getBoundingClientRect();
            const xPct = ((btnRect.left + btnRect.width / 2 - boxRect.left) / boxRect.width) * 100;
            const yPct = ((btnRect.top + btnRect.height / 2 - boxRect.top) / boxRect.height) * 100;
            
            App.addGoalMapPoint('time', xPct, yPct, '#888888', 'timeTrackingBox');
          }
        };
        
        // Nur noch EINEN Event Listener - click
        btn.addEventListener("click", handleIncrement);
      });
    });
    
    // Filter anwenden, falls einer aktiv ist
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
          // Show only markers for selected player
          if (marker.dataset.player === this.playerFilter) {
            marker.style.display = '';
          } else {
            marker.style.display = 'none';
          }
        } else {
          // Show all markers
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
    
    const timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `p${pIdx}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        const key = `${periodNum}_${idx}`;
        const playerData = timeDataWithPlayers[key] || {};
        
        let displayVal = 0;
        if (this.playerFilter) {
          // Show only selected player's count
          displayVal = playerData[this.playerFilter] || 0;
        } else {
          // Show total across all players
          displayVal = Object.values(playerData).reduce((sum, val) => sum + val, 0);
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
    
    // Clear markers
    document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
    
    // Clear time data
    document.querySelectorAll("#torbildPage .time-btn").forEach(btn => btn.textContent = "0");
    localStorage.removeItem("timeData");
    localStorage.removeItem("timeDataWithPlayers");
    localStorage.removeItem("goalMapMarkers");
    
    alert("Goal Map zurückgesetzt.");
  }
};
