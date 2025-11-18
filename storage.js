// Teamspezifische Storage-Erweiterung
App.storage = {
  ...App.storage, // Bestehende Funktionen beibehalten
  
  // Aktuelle Team-ID ermitteln
  getCurrentTeamId() {
    return App.data.currentTeam || "team1";
  },
  
  // Teamspezifische Storage Keys
  getTeamStorageKey(key) {
    return `${key}_${this.getCurrentTeamId()}`;
  },
  
  // Teamspezifisches Speichern aller Daten
  saveAll() {
    this.saveSelectedPlayers();
    this.saveStatsData();
    this.savePlayerTimes();
    this.saveSeasonData();
    this.saveActiveTimersState();
    this.saveOpponentShots();
  },
  
  saveSelectedPlayers() {
    localStorage.setItem(
      this.getTeamStorageKey("selectedPlayers"), 
      JSON.stringify(App.data.selectedPlayers)
    );
  },
  
  saveStatsData() {
    localStorage.setItem(
      this.getTeamStorageKey("statsData"), 
      JSON.stringify(App.data.statsData)
    );
  },
  
  savePlayerTimes() {
    localStorage.setItem(
      this.getTeamStorageKey("playerTimes"), 
      JSON.stringify(App.data.playerTimes)
    );
  },
  
  saveSeasonData() {
    localStorage.setItem(
      this.getTeamStorageKey("seasonData"), 
      JSON.stringify(App.data.seasonData)
    );
  },
  
  saveActiveTimersState() {
    const activeTimerPlayers = Object.keys(App.data.activeTimers);
    localStorage.setItem(
      this.getTeamStorageKey("activeTimerPlayers"), 
      JSON.stringify(activeTimerPlayers)
    );
  },
  
  saveOpponentShots() {
    const shotCell = document.querySelector('.total-cell[data-cat="Shot"]');
    if (shotCell) {
      localStorage.setItem(
        this.getTeamStorageKey("opponentShots"), 
        shotCell.dataset.opp || "0"
      );
    }
  },
  
  // Teamspezifisches Laden aller Daten
  loadAll() {
    this.loadSelectedPlayers();
    this.loadStatsData();
    this.loadPlayerTimes();
    this.loadSeasonData();
    this.loadActiveTimersState();
    this.loadOpponentShots();
  },
  
  loadSelectedPlayers() {
    const saved = localStorage.getItem(this.getTeamStorageKey("selectedPlayers"));
    if (saved) {
      App.data.selectedPlayers = JSON.parse(saved);
    }
  },
  
  loadStatsData() {
    const saved = localStorage.getItem(this.getTeamStorageKey("statsData"));
    if (saved) {
      App.data.statsData = JSON.parse(saved);
    }
  },
  
  loadPlayerTimes() {
    const saved = localStorage.getItem(this.getTeamStorageKey("playerTimes"));
    if (saved) {
      App.data.playerTimes = JSON.parse(saved);
    }
  },
  
  loadSeasonData() {
    const saved = localStorage.getItem(this.getTeamStorageKey("seasonData"));
    if (saved) {
      App.data.seasonData = JSON.parse(saved);
    }
  },
  
  loadActiveTimersState() {
    const saved = localStorage.getItem(this.getTeamStorageKey("activeTimerPlayers"));
    if (saved) {
      const activeTimerPlayers = JSON.parse(saved);
      activeTimerPlayers.forEach(playerName => {
        App.startPlayerTimer(playerName);
      });
    }
  },
  
  loadOpponentShots() {
    const saved = localStorage.getItem(this.getTeamStorageKey("opponentShots"));
    if (saved) {
      // Wird beim Render der Tabelle angewendet
      setTimeout(() => {
        const shotCell = document.querySelector('.total-cell[data-cat="Shot"]');
        if (shotCell) {
          shotCell.dataset.opp = saved;
        }
      }, 100);
    }
  },
  
  // Reset nur für aktuelles Team
  resetCurrentTeam() {
    const teamId = this.getCurrentTeamId();
    const keysToRemove = [
      `selectedPlayers_${teamId}`,
      `statsData_${teamId}`,
      `playerTimes_${teamId}`,
      `seasonData_${teamId}`,
      `activeTimerPlayers_${teamId}`,
      `opponentShots_${teamId}`
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Reset App Data
    App.data.selectedPlayers = [];
    App.data.statsData = {};
    App.data.playerTimes = {};
    App.data.seasonData = {};
    App.data.activeTimers = {};
  }
};
