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
        
        // Flag to prevent double-firing from touch and click
        let isProcessing = false;
        
        const handleIncrement = (e) => {
          // Prevent double-firing
          if (isProcessing) {
            e.preventDefault();
            return;
          }
          
          isProcessing = true;
          
          // Prevent default for touch to avoid ghost clicks
          if (e.type === 'touchend') {
            e.preventDefault();
          }
          
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
          
          // Reset processing flag after a short delay
          setTimeout(() => {
            isProcessing = false;
          }, 300);
        };
        
        // Add both click and touchend listeners
        btn.addEventListener("click", handleIncrement);
        btn.addEventListener("touchend", handleIncrement);
      });
    });
    
    // Filter anwenden, falls einer aktiv ist
    if (this.playerFilter) {
      this.applyTimeTrackingFilter();
    }
  }