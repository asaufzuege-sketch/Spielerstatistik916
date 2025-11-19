// Team Selection Module mit vollständig separater Datenspeicherung
App.teamSelection = {
  container: null,
  currentTeam: 1,
  
  init() {
    // Wire up the existing HTML team buttons
    this.setupTeamButtons();
    this.initTeamFromStorage();
  },
  
  setupTeamButtons() {
    // Add event listeners to the team selection buttons in HTML
    for (let i = 1; i <= 3; i++) {
      const btn = document.getElementById(`teamBtn${i}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.selectTeamAndNavigate(i);
        });
      }
    }
  },
  
  selectTeamAndNavigate(teamNumber) {
    // Switch to the selected team
    this.switchTeam(teamNumber);
    
    // Navigate to player selection page
    if (typeof App.showPage === 'function') {
      App.showPage('selection');
    }
  },
  
  createTeamButtons() {
    // This function is kept for compatibility but HTML buttons are used instead
    // The actual team button setup happens in setupTeamButtons()
    return;
  },
  
  switchTeam(teamNumber) {
    if (teamNumber === this.currentTeam) return; // Already on this team
    
    console.log(`Switching from team ${this.currentTeam} to team ${teamNumber}`);
    
    // Save current team data before switching
    this.saveCurrentTeamData();
    
    // Stop all active timers for current team
    this.stopAllTimers();
    
    // Switch team
    const previousTeam = this.currentTeam;
    this.currentTeam = teamNumber;
    App.data.currentTeam = `team${teamNumber}`;
    
    // Save team selection
    localStorage.setItem("currentTeam", App.data.currentTeam);
    
    // Load new team data
    this.loadTeamData(teamNumber);
    
    // Update UI
    this.updateButtonStates();
    this.refreshAllTables();
    
    console.log(`Successfully switched from team ${previousTeam} to team ${teamNumber}`);
  },
  
  saveCurrentTeamData() {
    if (!this.currentTeam) return;
    
    const teamId = `team${this.currentTeam}`;
    
    // Save all current data with team prefix
    localStorage.setItem(`selectedPlayers_${teamId}`, JSON.stringify(App.data.selectedPlayers || []));
    localStorage.setItem(`statsData_${teamId}`, JSON.stringify(App.data.statsData || {}));
    localStorage.setItem(`playerTimes_${teamId}`, JSON.stringify(App.data.playerTimes || {}));
    localStorage.setItem(`seasonData_${teamId}`, JSON.stringify(App.data.seasonData || {}));
    
    // Save opponent shots
    const shotCell = document.querySelector('.total-cell[data-cat="Shot"]');
    if (shotCell && shotCell.dataset.opp) {
      localStorage.setItem(`opponentShots_${teamId}`, shotCell.dataset.opp);
    }
    
    // Save active timer players
    const activeTimerPlayers = Object.keys(App.data.activeTimers || {});
    localStorage.setItem(`activeTimerPlayers_${teamId}`, JSON.stringify(activeTimerPlayers));
    
    console.log(`Saved data for ${teamId}`);
  },
  
  loadTeamData(teamNumber) {
    const teamId = `team${teamNumber}`;
    
    // Load team-specific data or use defaults
    const savedPlayers = localStorage.getItem(`selectedPlayers_${teamId}`);
    const savedStats = localStorage.getItem(`statsData_${teamId}`);
    const savedTimes = localStorage.getItem(`playerTimes_${teamId}`);
    const savedSeason = localStorage.getItem(`seasonData_${teamId}`);
    const savedOppShots = localStorage.getItem(`opponentShots_${teamId}`);
    const savedActiveTimers = localStorage.getItem(`activeTimerPlayers_${teamId}`);
    
    // WICHTIG: Nur Team 1 bekommt default players, Team 2 und 3 starten leer
    let defaultPlayers = [];
    if (teamNumber === 1 && !savedPlayers) {
      // Team 1: Verwende defaultPlayers nur wenn keine gespeicherten Daten existieren
      // Dies ist nur für das erste Mal, danach kommen die Spieler aus localStorage
      defaultPlayers = [];
    }
    
    // Reset App data
    App.data.selectedPlayers = savedPlayers ? JSON.parse(savedPlayers) : defaultPlayers;
    App.data.statsData = savedStats ? JSON.parse(savedStats) : {};
    App.data.playerTimes = savedTimes ? JSON.parse(savedTimes) : {};
    App.data.seasonData = savedSeason ? JSON.parse(savedSeason) : {};
    App.data.activeTimers = {};
    
    // Restore active timers if any
    if (savedActiveTimers) {
      const timerPlayers = JSON.parse(savedActiveTimers);
      timerPlayers.forEach(playerName => {
        if (App.data.selectedPlayers.some(p => p.name === playerName)) {
          App.startPlayerTimer(playerName);
        }
      });
    }
    
    // Restore opponent shots (will be applied when table renders)
    if (savedOppShots) {
      setTimeout(() => {
        const shotCell = document.querySelector('.total-cell[data-cat="Shot"]');
        if (shotCell) {
          shotCell.dataset.opp = savedOppShots;
          App.statsTable.updateTotals();
        }
      }, 100);
    }
    
    console.log(`Loaded data for ${teamId}`, {
      players: App.data.selectedPlayers.length,
      hasStats: Object.keys(App.data.statsData).length > 0,
      hasTimers: Object.keys(App.data.activeTimers).length > 0
    });
  },
  
  stopAllTimers() {
    Object.values(App.data.activeTimers || {}).forEach(timer => {
      if (timer) clearInterval(timer);
    });
    App.data.activeTimers = {};
  },
  
  updateButtonStates() {
    // Update the visual state of team buttons in HTML
    for (let i = 1; i <= 3; i++) {
      const btn = document.getElementById(`teamBtn${i}`);
      if (btn) {
        if (i === this.currentTeam) {
          btn.classList.add('active-team');
        } else {
          btn.classList.remove('active-team');
        }
      }
    }
  },
  
  refreshAllTables() {
    // Refresh stats table
    if (App.statsTable && App.statsTable.render) {
      App.statsTable.render();
    }
    
    // Refresh season table
    if (App.seasonTable && App.seasonTable.render) {
      App.seasonTable.render();
    }
    
    // Update timer visuals
    if (App.updateTimerVisuals) {
      App.updateTimerVisuals();
    }
    
    // Event-Listener für Navigation-Buttons neu setzen (Fix für das Button-Problem)
    setTimeout(() => {
      // "Spieler wählen" Button Event-Listener neu setzen
      const selectPlayersBtn = document.getElementById("selectPlayersBtn");
      if (selectPlayersBtn) {
        selectPlayersBtn.onclick = () => App.showPage("selection");
      }
      
      // Alle anderen Navigation-Buttons neu setzen
      const torbildBtn = document.getElementById("torbildBtn");
      if (torbildBtn) {
        torbildBtn.onclick = () => App.showPage("torbild");
      }
      
      const goalValueBtn = document.getElementById("goalValueBtn");
      if (goalValueBtn) {
        goalValueBtn.onclick = () => App.showPage("goalValue");
      }
      
      const seasonBtn = document.getElementById("seasonBtn");
      if (seasonBtn) {
        seasonBtn.onclick = () => App.showPage("season");
      }
      
      const seasonMapBtn = document.getElementById("seasonMapBtn");
      if (seasonMapBtn) {
        seasonMapBtn.onclick = () => App.showPage("seasonMap");
      }
      
      // Auch Back-Buttons neu setzen
      const backToTeamSelectionBtn = document.getElementById("backToTeamSelectionBtn");
      if (backToTeamSelectionBtn) {
        backToTeamSelectionBtn.onclick = () => App.showPage("teamSelection");
      }
      
      const backToStatsBtn = document.getElementById("backToStatsBtn");
      if (backToStatsBtn) {
        backToStatsBtn.onclick = () => App.showPage("stats");
      }
      
      const backToStatsFromSeasonBtn = document.getElementById("backToStatsFromSeasonBtn");
      if (backToStatsFromSeasonBtn) {
        backToStatsFromSeasonBtn.onclick = () => App.showPage("stats");
      }
      
      const backToStatsFromSeasonMapBtn = document.getElementById("backToStatsFromSeasonMapBtn");
      if (backToStatsFromSeasonMapBtn) {
        backToStatsFromSeasonMapBtn.onclick = () => App.showPage("stats");
      }
      
      const backFromGoalValueBtn = document.getElementById("backFromGoalValueBtn");
      if (backFromGoalValueBtn) {
        backFromGoalValueBtn.onclick = () => App.showPage("stats");
      }
    }, 100);
  },
  
  initTeamFromStorage() {
    const savedTeam = localStorage.getItem("currentTeam");
    if (savedTeam) {
      const teamNumber = parseInt(savedTeam.replace('team', ''));
      if (teamNumber >= 1 && teamNumber <= 3) {
        this.currentTeam = teamNumber;
        App.data.currentTeam = savedTeam;
        this.loadTeamData(teamNumber);
      } else {
        // Invalid team number, default to team 1
        this.switchTeam(1);
      }
    } else {
      // No saved team, default to team 1
      this.switchTeam(1);
    }
    
    this.updateButtonStates();
  },
  
  resetCurrentTeam() {
    const teamId = `team${this.currentTeam}`;
    const teamName = `Team ${this.currentTeam}`;
    
    if (!confirm(`${teamName} Daten vollständig zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return false;
    }
    
    // Stop all timers
    this.stopAllTimers();
    
    // Remove team-specific data from localStorage
    const keysToRemove = [
      `selectedPlayers_${teamId}`,
      `statsData_${teamId}`,
      `playerTimes_${teamId}`,
      `seasonData_${teamId}`,
      `opponentShots_${teamId}`,
      `activeTimerPlayers_${teamId}`
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Reset app data
    App.data.selectedPlayers = [];
    App.data.statsData = {};
    App.data.playerTimes = {};
    App.data.seasonData = {};
    App.data.activeTimers = {};
    
    // Refresh UI
    this.refreshAllTables();
    
    console.log(`Reset completed for ${teamName}`);
    alert(`${teamName} wurde zurückgesetzt. Andere Teams sind unberührt.`);
    
    return true;
  },
  
  // Get current team info
  getCurrentTeamInfo() {
    return {
      number: this.currentTeam,
      id: `team${this.currentTeam}`,
      name: `Team ${this.currentTeam}`,
      playerCount: App.data.selectedPlayers.length,
      hasData: Object.keys(App.data.statsData).length > 0
    };
  },
  
  // Export current team data
  exportCurrentTeam() {
    if (App.csvHandler && App.csvHandler.exportStats) {
      App.csvHandler.exportStats();
    }
  },
  
  // Import data for current team
  importToCurrentTeam() {
    if (App.csvHandler && App.csvHandler.fileInput) {
      App.csvHandler.fileInput.dataset.target = "stats";
      App.csvHandler.fileInput.click();
    }
  }
};
