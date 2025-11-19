// Theme Toggle Module
App.themeToggle = {
  init() {
    this.loadTheme();
    this.createToggleButton();
    this.watchSystemPreference();
  },

  loadTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update button text if it exists
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  },

  createToggleButton() {
    // Check if button already exists
    if (document.getElementById('themeToggleBtn')) {
      return;
    }

    // Create the theme toggle button
    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.className = 'theme-toggle-btn';
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    btn.textContent = currentTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    btn.setAttribute('aria-label', `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`);
    
    btn.addEventListener('click', () => this.toggleTheme());
    
    // Add to page - insert at top of first page that loads
    const teamSelectionPage = document.getElementById('teamSelectionPage');
    if (teamSelectionPage) {
      const h1 = teamSelectionPage.querySelector('h1');
      if (h1) {
        h1.parentNode.insertBefore(btn, h1);
      }
    }
  },

  watchSystemPreference() {
    // Watch for system theme changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    darkModeQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
};