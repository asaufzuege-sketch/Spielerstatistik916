// Add sticky styling to the player column header (line 122-129)
thPlayer.className = "gv-name-header";
thPlayer.style.position = "sticky";
thPlayer.style.left = "0";
thPlayer.style.zIndex = "3";
thPlayer.style.background = "#1e1e1e";

// Add sticky styling to player column cells (line 173-182)
tdName.className = "gv-name-cell";
tdName.style.position = "sticky";
tdName.style.left = "0";
tdName.style.zIndex = "2";
tdName.style.background = rowIdx % 2 === 0 ? "#252525" : "#1e1e1e";

// Add sticky styling to bottom row label cell (line 266-271)
labelTd.style.position = "sticky";
labelTd.style.left = "0";
labelTd.style.zIndex = "2";
labelTd.style.background = playersList.length % 2 === 0 ? "#252525" : "#1e1e1e";

// Fix dropdown value persistence (line 297-298)
const b = this.getBottom(); 
const currentValue = b && typeof b[i] !== "undefined" ? b[i] : 0; 
select.value = String(currentValue);