// Team Selection Module
App.teamSelection = {
    currentTeam: 1,
    maxPlayers: 16,
    
    init() {
        console.log('Team Selection Module loading...');
        console.log('Initializing Team Selection');
        
        // Load saved team
        const savedTeam = localStorage.getItem('currentTeam');
        if (savedTeam) {
            this.currentTeam = parseInt(savedTeam);
        }
        
        // Setup team tabs
        this.setupTeamTabs();
        
        // Load current team data
        this.loadTeamData(this.currentTeam);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.renderPlayerList();
    },
    
    setupTeamTabs() {
        const tabsContainer = document.querySelector('.team-tabs');
        if (!tabsContainer) {
            console.error('Team tabs container not found');
            return;
        }
        
        // Update existing tabs instead of recreating
        document.querySelectorAll('.team-tab').forEach(tab => {
            const teamNum = parseInt(tab.dataset.team);
            tab.classList.toggle('active', teamNum === this.currentTeam);
            
            // Add click handler if not already added
            if (!tab.hasAttribute('data-initialized')) {
                tab.addEventListener('click', () => {
                    const newTeam = parseInt(tab.dataset.team);
                    if (newTeam !== this.currentTeam) {
                        this.switchTeam(newTeam);
                    }
                });
                tab.setAttribute('data-initialized', 'true');
            }
        });
    },
    
    setupEventListeners() {
        // Add player button
        const addBtn = document.querySelector('.add-player-btn');
        if (addBtn && !addBtn.hasAttribute('data-initialized')) {
            addBtn.addEventListener('click', () => this.addNewPlayer());
            addBtn.setAttribute('data-initialized', 'true');
        }
        
        // Continue button
        const continueBtn = document.querySelector('.continue-btn');
        if (continueBtn && !continueBtn.hasAttribute('data-initialized')) {
            continueBtn.addEventListener('click', () => {
                const teamData = this.getTeamData();
                if (teamData.players && teamData.players.length > 0) {
                    window.location.href = 'game-setup.html';
                } else {
                    alert('Bitte fügen Sie mindestens einen Spieler hinzu');
                }
            });
            continueBtn.setAttribute('data-initialized', 'true');
        }
    },
    
    switchTeam(newTeam) {
        console.log(`Switching from team ${this.currentTeam} to team ${newTeam}`);
        
        // Save current team data
        this.saveTeamData(this.currentTeam);
        
        // Update current team
        const oldTeam = this.currentTeam;
        this.currentTeam = newTeam;
        localStorage.setItem('currentTeam', this.currentTeam);
        
        // Update UI
        document.querySelectorAll('.team-tab').forEach(tab => {
            tab.classList.toggle('active', parseInt(tab.dataset.team) === this.currentTeam);
        });
        
        // Load new team data
        this.loadTeamData(newTeam);
        
        // Render player list
        this.renderPlayerList();
        
        console.log(`Successfully switched from team ${oldTeam} to team ${newTeam}`);
    },
    
    saveTeamData(teamNumber) {
        const data = this.getTeamData();
        localStorage.setItem(`team${teamNumber}Data`, JSON.stringify(data));
        console.log(`Saved data for team${teamNumber}`);
    },
    
    loadTeamData(teamNumber) {
        const savedData = localStorage.getItem(`team${teamNumber}Data`);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                // Ensure players is an array
                if (!data.players) {
                    data.players = [];
                }
                if (!Array.isArray(data.players)) {
                    data.players = [];
                }
                this.setTeamData(data);
                console.log(`Loaded data for team${teamNumber}`, {
                    players: data.players.length,
                    hasStats: data.hasStats !== false,
                    hasTimers: data.hasTimers === true
                });
            } catch (e) {
                console.error('Error loading team data:', e);
                this.setTeamData({ players: [], hasStats: true, hasTimers: false });
            }
        } else {
            this.setTeamData({ players: [], hasStats: true, hasTimers: false });
        }
    },
    
    getTeamData() {
        const key = `team${this.currentTeam}Data`;
        if (!window[key]) {
            window[key] = { players: [], hasStats: true, hasTimers: false };
        }
        if (!window[key].players) {
            window[key].players = [];
        }
        if (!Array.isArray(window[key].players)) {
            window[key].players = [];
        }
        return window[key];
    },
    
    setTeamData(data) {
        const key = `team${this.currentTeam}Data`;
        window[key] = data;
    },
    
    renderPlayerList() {
        const playerList = document.querySelector('.player-list');
        if (!playerList) return;
        
        const teamData = this.getTeamData();
        const players = teamData.players || [];
        
        playerList.innerHTML = '';
        
        players.forEach((player, index) => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.dataset.index = index;
            
            const playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            playerInfo.innerHTML = `
                <span class="player-number">#${player.number}</span>
                <span class="player-name">${player.name}</span>
            `;
            
            const playerActions = document.createElement('div');
            playerActions.className = 'player-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = '✏️';
            editBtn.onclick = () => this.editPlayer(index);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️';
            deleteBtn.onclick = () => this.deletePlayer(index);
            
            playerActions.appendChild(editBtn);
            playerActions.appendChild(deleteBtn);
            
            playerCard.appendChild(playerInfo);
            playerCard.appendChild(playerActions);
            
            playerList.appendChild(playerCard);
        });
        
        // Update counter
        this.updatePlayerCounter();
    },
    
    updatePlayerCounter() {
        const counter = document.querySelector('.player-counter');
        if (counter) {
            const count = this.getTeamData().players.length;
            counter.textContent = `${count}/${this.maxPlayers} Spieler`;
        }
    },
    
    addNewPlayer() {
        const teamData = this.getTeamData();
        if (teamData.players.length >= this.maxPlayers) {
            alert(`Maximum ${this.maxPlayers} Spieler pro Team`);
            return;
        }
        
        const name = prompt('Spielername:');
        if (!name || !name.trim()) return;
        
        const number = prompt('Rückennummer:');
        if (!number || isNaN(number)) return;
        
        teamData.players.push({
            name: name.trim(),
            number: parseInt(number),
            position: ''
        });
        
        this.saveTeamData(this.currentTeam);
        this.renderPlayerList();
    },
    
    editPlayer(index) {
        const teamData = this.getTeamData();
        const player = teamData.players[index];
        if (!player) return;
        
        const newName = prompt('Spielername:', player.name);
        if (newName === null) return;
        
        const newNumber = prompt('Rückennummer:', player.number);
        if (newNumber === null) return;
        
        if (newName.trim() && !isNaN(newNumber)) {
            player.name = newName.trim();
            player.number = parseInt(newNumber);
            
            this.saveTeamData(this.currentTeam);
            this.renderPlayerList();
        }
    },
    
    deletePlayer(index) {
        if (confirm('Spieler wirklich löschen?')) {
            const teamData = this.getTeamData();
            teamData.players.splice(index, 1);
            this.saveTeamData(this.currentTeam);
            this.renderPlayerList();
        }
    },
    
    getCurrentTeamInfo() {
        return {
            id: `team${this.currentTeam}`,
            number: this.currentTeam,
            data: this.getTeamData()
        };
    },
    
    updateButtonStates() {
        // Compatibility method for showPage
    }
};
