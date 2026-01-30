/**
 * Theme Management
 */
const Theme = {
  /**
   * Get ink color based on current theme
   */
  getINK() {
    return GameState.isDark ? '#f4f1eb' : '#1a1a1a';
  },

  /**
   * Get background color based on current theme
   */
  getBG() {
    return GameState.isDark ? '#1a1a1a' : '#f4f1eb';
  },

  /**
   * Get faint color based on current theme
   */
  getFAINT() {
    return GameState.isDark ? '#333' : '#ddd';
  },

  /**
   * Get muted color based on current theme
   */
  getMUTED() {
    return '#888';
  },

  /**
   * Apply current theme to DOM
   */
  apply() {
    document.documentElement.setAttribute('data-theme', GameState.isDark ? 'dark' : 'light');
    document.querySelector('.theme-toggle-text').textContent = GameState.isDark ? 'Dark' : 'Light';
    document.getElementById('modalThemeText').textContent = GameState.isDark ? 'Dark Mode' : 'Light Mode';
    document.querySelector('meta[name="theme-color"]').setAttribute('content', this.getBG());
    document.getElementById('themeIcon').textContent = GameState.isDark ? '\u263E' : '\u2600';
    document.getElementById('modalThemeIcon').textContent = GameState.isDark ? '\u263E' : '\u2600';
  },

  /**
   * Toggle theme between light and dark
   */
  toggle() {
    GameState.isDark = !GameState.isDark;
    localStorage.setItem('wooorm-theme', GameState.isDark ? 'dark' : 'light');
    this.apply();
  }
};
