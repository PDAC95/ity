/**
 * ITY i18n - Lightweight internationalization for static HTML
 * Supports: EN, ES, FR, PT
 */
const ITYi18n = {
  currentLang: 'en',
  translations: {},
  supportedLangs: ['en', 'es', 'fr', 'pt'],

  /**
   * Initialize i18n system
   */
  async init() {
    // Get language from: URL param > localStorage > browser > default
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const storedLang = localStorage.getItem('ity-lang');
    const browserLang = navigator.language.slice(0, 2);

    let lang = urlLang || storedLang || browserLang || 'en';

    // Validate language is supported
    if (!this.supportedLangs.includes(lang)) {
      lang = 'en';
    }

    this.currentLang = lang;
    await this.loadTranslations(lang);
    this.translate();
    this.updateLangSelector();
    this.updateHtmlLang();
  },

  /**
   * Load translations from JSON file
   */
  async loadTranslations(lang) {
    try {
      const response = await fetch(`./locales/${lang}.json`);
      if (!response.ok) throw new Error('Translation file not found');
      this.translations = await response.json();
    } catch (error) {
      console.warn(`Could not load ${lang} translations, falling back to English`);
      if (lang !== 'en') {
        const response = await fetch('./locales/en.json');
        this.translations = await response.json();
        this.currentLang = 'en';
      }
    }
  },

  /**
   * Get nested translation value by dot notation key
   */
  get(key) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === 'string' ? value : null;
  },

  /**
   * Translate all elements with data-i18n attribute
   */
  translate() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translation = this.get(key);
      if (translation) {
        el.textContent = translation;
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const translation = this.get(key);
      if (translation) {
        el.placeholder = translation;
      }
    });

    // Translate aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.dataset.i18nAria;
      const translation = this.get(key);
      if (translation) {
        el.setAttribute('aria-label', translation);
      }
    });
  },

  /**
   * Change language
   */
  async setLang(lang) {
    if (!this.supportedLangs.includes(lang)) return;

    this.currentLang = lang;
    localStorage.setItem('ity-lang', lang);

    await this.loadTranslations(lang);
    this.translate();
    this.updateLangSelector();
    this.updateHtmlLang();

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
  },

  /**
   * Update language selector UI
   */
  updateLangSelector() {
    // Update current language display
    const currentLangEl = document.getElementById('current-lang');
    if (currentLangEl) {
      currentLangEl.textContent = this.currentLang.toUpperCase();
    }

    // Update all lang options active state
    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
    });
  },

  /**
   * Setup dropdown toggle behavior
   */
  setupDropdown() {
    const wrapper = document.getElementById('lang-selector-wrapper');
    const toggle = document.getElementById('lang-toggle');
    const dropdown = document.getElementById('lang-dropdown');

    if (!wrapper || !toggle || !dropdown) return;

    // Toggle dropdown on button click
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      wrapper.classList.toggle('open');
    });

    // Handle language option clicks
    dropdown.querySelectorAll('.lang-option').forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.dataset.lang;
        this.setLang(lang);
        wrapper.classList.remove('open');
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        wrapper.classList.remove('open');
      }
    });
  },

  /**
   * Update HTML lang attribute
   */
  updateHtmlLang() {
    document.documentElement.lang = this.currentLang;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  ITYi18n.init();
  ITYi18n.setupDropdown();
});

// Export for global access
window.ITYi18n = ITYi18n;
