// Player Selection Modul
App.playerSelection = {
  container: null,
  confirmBtn: null,
  
  init() {
    this.container = document.getElementById("playerList");
    this.confirmBtn = document.getElementById("confirmSelection");
    
    if (this.container) {
      this.render();
    }
    
    if (this.confirmBtn) {
      this.confirmBtn.addEventListener("click", () => this.handleConfirm());
    }
  },
  
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = "";
    
    const sortedPlayers = App.data.players.slice().sort((a, b) => {
      const na = Number(a.num) || 999;
      const nb = Number(b.num) || 999;
      return na - nb;
    });
    
    sortedPlayers.forEach((p, idx) => {
      const li = document.createElement("li");
      const checkboxId = `player-chk-${idx}`;
      const checked = App.data.selectedPlayers.find(sp => sp.name === p.name && p.name !== "") ? "checked" : "";
      
      // Check if this is an empty player slot (both num and name are empty)
      const isEmpty = (p.num === "" || p.num === null || p.num === undefined || String(p.num).trim() === "") &&
                      (p.name === "" || p.name === null || p.name === undefined || String(p.name).trim() === "");
      
      let numAreaHtml = "";
      let nameAreaHtml = "";
      
      if (isEmpty) {
        // For empty slots: show input fields for both number and name
        numAreaHtml = `<div style="flex:0 0 64px;text-align:center;">
                         <input class="num-input" type="text" inputmode="numeric" maxlength="3" placeholder="Nr." value="" style="width:56px;padding:6px;border-radius:6px;border:1px solid #444;">
                       </div>`;
        nameAreaHtml = `<input type="text" class="name-input" placeholder="Spielername eingeben" value="" style="flex:1;min-width:0;border-radius:6px;border:1px solid #444;padding:6px;color:#eee;">`;
      } else if (p.num !== "" && p.num !== null && p.num !== undefined && String(p.num).trim() !== "") {
        // Player has a number: show number as text, name as text
        numAreaHtml = `<div class="num" style="flex:0 0 48px;text-align:center;"><strong>${App.helpers.escapeHtml(p.num)}</strong></div>`;
        nameAreaHtml = `<div class="name" style="flex:1;color:#eee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><strong>${App.helpers.escapeHtml(p.name)}</strong></div>`;
      } else {
        // Player has name but no number: show number input, name as text
        numAreaHtml = `<div style="flex:0 0 64px;text-align:center;">
                         <input class="num-input" type="text" inputmode="numeric" maxlength="3" placeholder="Nr." value="" style="width:56px;padding:6px;border-radius:6px;border:1px solid #444;">
                       </div>`;
        nameAreaHtml = `<div class="name" style="flex:1;color:#eee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><strong>${App.helpers.escapeHtml(p.name)}</strong></div>`;
      }
      
      li.innerHTML = `
        <label class="player-line" style="display:flex;align-items:center;gap:8px;width:100%;" for="${checkboxId}">
          <input id="${checkboxId}" type="checkbox" value="${App.helpers.escapeHtml(p.name)}" ${checked} style="flex:0 0 auto" data-player-index="${idx}">
          ${numAreaHtml}
          ${nameAreaHtml}
        </label>`;
      this.container.appendChild(li);
    });
    
    const customSelected = App.data.selectedPlayers.filter(sp => 
      !App.data.players.some(bp => bp.name === sp.name)
    );
    
    for (let i = 0; i < 5; i++) {
      const pre = customSelected[i];
      const li = document.createElement("li");
      const chkId = `custom-chk-${i}`;
      
      li.innerHTML = `
        <label class="custom-line" style="display:flex;align-items:center;gap:8px;width:100%;" for="${chkId}">
          <input id="${chkId}" type="checkbox" class="custom-checkbox" ${pre ? "checked" : ""} style="flex:0 0 auto">
          <input type="text" class="custom-num" inputmode="numeric" maxlength="3" placeholder="Nr." value="${App.helpers.escapeHtml(pre?.num || "")}" style="width:56px;flex:0 0 auto;padding:6px;border-radius:6px;border:1px solid #444;">
          <input type="text" class="custom-name" placeholder="Eigener Spielername" value="${App.helpers.escapeHtml(pre?.name || "")}" style="flex:1;min-width:0;border-radius:6px;border:1px solid #444;padding:6px;">
        </label>`;
      this.container.appendChild(li);
    }
  },
  
  handleConfirm() {
    try {
      App.data.selectedPlayers = [];
      
      // Get all checkboxes that are not custom
      const allCheckboxes = Array.from(this.container.querySelectorAll("input[type='checkbox']:not(.custom-checkbox)"));
      
      allCheckboxes.forEach((chk, checkboxIdx) => {
        const li = chk.closest("li");
        if (!li) return;
        
        const numInput = li.querySelector(".num-input");
        const nameInput = li.querySelector(".name-input");
        const numDiv = li.querySelector(".num");
        const nameDiv = li.querySelector(".name");
        
        let num = "";
        let name = "";
        
        // Get number value
        if (numInput) {
          num = numInput.value.trim();
        } else if (numDiv) {
          num = numDiv.textContent.trim();
        }
        
        // Get name value
        if (nameInput) {
          name = nameInput.value.trim();
        } else if (nameDiv) {
          name = nameDiv.textContent.trim();
        } else {
          name = chk.value;
        }
        
        // Update the player pool with any changes
        const playerIndex = parseInt(chk.dataset.playerIndex);
        if (!isNaN(playerIndex) && playerIndex < App.data.players.length) {
          if (nameInput || numInput) {
            // Update player in pool if either field was editable
            App.data.players[playerIndex] = { num, name };
          }
        }
        
        // Add to selected players if checked and has a name
        if (chk.checked && name !== "") {
          App.data.selectedPlayers.push({ num, name });
        }
      });
      
      const customLis = Array.from(this.container.querySelectorAll("li")).slice(App.data.players.length);
      customLis.forEach((li, idx) => {
        const chk = li.querySelector(".custom-checkbox");
        const numInput = li.querySelector(".custom-num");
        const nameInput = li.querySelector(".custom-name");
        
        if (nameInput && nameInput.value.trim() !== "") {
          const num = numInput ? (numInput.value.trim() || "") : "";
          const name = nameInput.value.trim();
          
          // Update or add to player pool
          if (idx < App.data.players.length) {
            App.data.players[idx] = { num, name };
          } else {
            App.data.players.push({ num, name });
          }
          
          if (chk && chk.checked) {
            App.data.selectedPlayers.push({ num, name });
          }
        }
      });
      
      // Save the updated player pool
      if (App.teamSelection && App.teamSelection.currentTeam) {
        const teamId = `team${App.teamSelection.currentTeam}`;
        localStorage.setItem(`playerPool_${teamId}`, JSON.stringify(App.data.players));
      }
      
      App.storage.saveSelectedPlayers();
      
      App.data.selectedPlayers.forEach(p => {
        if (!App.data.statsData[p.name]) {
          App.data.statsData[p.name] = {};
        }
        App.data.categories.forEach(c => {
          if (App.data.statsData[p.name][c] === undefined) {
            App.data.statsData[p.name][c] = 0;
          }
        });
      });
      
      App.storage.saveStatsData();
      
      // KORRIGIERT: Prüfe ob App.showPage existiert
      if (typeof App.showPage === 'function') {
        App.showPage("stats");
      } else {
        console.warn("App.showPage ist noch nicht definiert");
        // Fallback: Direkt die Seiten umschalten
        document.getElementById("playerSelectionPage").style.display = "none";
        document.getElementById("statsPage").style.display = "block";
      }
      
      if (App.statsTable && typeof App.statsTable.render === 'function') {
        App.statsTable.render();
      }
      
    } catch (err) {
      console.error("Error in confirmSelection:", err);
      alert("Fehler beim Bestätigen (siehe Konsole): " + (err?.message || err));
    }
  }
};
