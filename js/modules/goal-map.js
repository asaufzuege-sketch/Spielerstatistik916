initTimeTracking() {
  if (!this.timeTrackingBox) return;
  
  let timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
  
  this.timeTrackingBox.querySelectorAll(".period").forEach(period => {
    const periodNum = period.dataset.period || Math.random().toString(36).slice(2, 6);
    const buttons = period.querySelectorAll(".time-btn");
    
    buttons.forEach((btn, idx) => {
      const key = `${periodNum}_${idx}`;
      
      const playerData = timeDataWithPlayers[key] || {};
      let total = 0;
      Object.values(playerData).forEach(count => {
        total += count;
      });
      btn.textContent = total;
      
      let clickCount = 0;
      let clickTimer = null;
      
      const updateValue = (delta) => {
        const playerName = App.goalMapWorkflow.active ? App.goalMapWorkflow.playerName : '_anonymous';
        
        if (!timeDataWithPlayers[key]) {
          timeDataWithPlayers[key] = {};
        }
        if (!timeDataWithPlayers[key][playerName]) {
          timeDataWithPlayers[key][playerName] = 0;
        }
        
        timeDataWithPlayers[key][playerName] = Math.max(0, timeDataWithPlayers[key][playerName] + delta);
        
        let newTotal = 0;
        Object.values(timeDataWithPlayers[key]).forEach(count => {
          newTotal += count;
        });
        
        btn.textContent = newTotal;
        localStorage.setItem("timeDataWithPlayers", JSON.stringify(timeDataWithPlayers));
        
        if (delta > 0 && App.goalMapWorkflow.active) {
          const btnRect = btn.getBoundingClientRect();
          const boxRect = this.timeTrackingBox.getBoundingClientRect();
          
          const xPct = ((btnRect.left + btnRect.width / 2 - boxRect.left) / boxRect.width) * 100;
          const yPct = ((btnRect.top + btnRect.height / 2 - boxRect.top) / boxRect.height) * 100;
          
          App.addGoalMapPoint('time', xPct, yPct, '#888888', 'timeTrackingBox');
        }
      };
      
      const handleClick = () => {
        clickCount++;
        
        if (clickTimer) {
          clearTimeout(clickTimer);
        }
        
        clickTimer = setTimeout(() => {
          if (clickCount === 1) {
            updateValue(+1);
          } else if (clickCount >= 2) {
            updateValue(-1);
          }
          
          clickCount = 0;
          clickTimer = null;
        }, 300);
      };
      
      btn.addEventListener("click", handleClick);
      
      btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleClick();
      }, { passive: false });
    });
  });
}