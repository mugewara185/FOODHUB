/**
 * Redux Logger Configuration
 * ===========================
 * 
 * Centralized configuration for Redux state and action logging
 * Toggle logging on/off per feature, action type, or globally
 * 
 * Best Practices:
 * 1. Use feature-level toggles for selective debugging
 * 2. Disable verbose logging in production
 * 3. Use filterSensitiveData to avoid logging passwords/tokens
 * 4. Enable performance monitoring for complex operations
 */

import { IS_DEV } from '../../../core/config/app.config';

export interface ReduxLoggerConfig {
  // Global enable/disable
  enabled: boolean;

  // Log what?
  logActions: boolean;
  logStateChanges: boolean;
  logPayloadData: boolean;
  logPreviousState: boolean;
  logNextState: boolean;
  logDiff: boolean;
  logDuration: boolean;
  logStackTrace: boolean;

  // Performance monitoring
  enablePerformanceMetrics: boolean;
  enableSlowActionWarning: boolean;
  slowActionThreshold: number; // milliseconds

  // Feature-level toggles
  featureLogging: {
    auth: boolean;
    cart: boolean;
    restaurants: boolean;
    ui: boolean;
  };

  // Which actions to log (whitelist/blacklist)
  actionFilter: {
    mode: 'all' | 'whitelist' | 'blacklist';
    actions?: string[];
  };

  // Sensitive data to mask
  filterSensitiveData: boolean;
  sensitiveKeys?: string[];

  // Pretty format output
  prettyPrint: boolean;
  maxPayloadSize: number; // characters - truncate large objects

  // Storage config
  persistLogs: boolean;
  maxStoredLogs: number;
}

/**
 * Default Redux logger configuration
 * Comprehensive logging in dev mode, minimal in production
 */
export const REDUX_LOGGER_CONFIG: ReduxLoggerConfig = {
  // Global control
  enabled: IS_DEV,

  // Log everything in dev
  logActions: IS_DEV,
  logStateChanges: IS_DEV,
  logPayloadData: IS_DEV,
  logPreviousState: IS_DEV,
  logNextState: IS_DEV,
  logDiff: IS_DEV,
  logDuration: IS_DEV,
  logStackTrace: false, // Stack traces are verbose, disable by default

  // Performance
  enablePerformanceMetrics: IS_DEV,
  enableSlowActionWarning: IS_DEV,
  slowActionThreshold: 100, // warn if action takes > 100ms

  // All features enabled in dev
  featureLogging: {
    auth: IS_DEV,
    cart: IS_DEV,
    restaurants: IS_DEV,
    ui: false, // UI logs are very frequent, disable by default
  },

  // Log all actions by default
  actionFilter: {
    mode: 'all',
  },

  // Mask sensitive data
  filterSensitiveData: true,
  sensitiveKeys: ['password', 'token', 'secret', 'apiKey', 'refreshToken'],

  // Pretty output
  prettyPrint: true,
  maxPayloadSize: 1000,

  // Storage
  persistLogs: IS_DEV,
  maxStoredLogs: 500,
};

/**
 * Runtime logger control
 * Allows toggling logs on/off during development without restarting
 */
class ReduxLoggerControl {
  private static instance: ReduxLoggerControl;
  private config: ReduxLoggerConfig = { ...REDUX_LOGGER_CONFIG };

  private constructor() {
    this.loadConfigFromStorage();
  }

  static getInstance(): ReduxLoggerControl {
    if (!ReduxLoggerControl.instance) {
      ReduxLoggerControl.instance = new ReduxLoggerControl();
    }
    return ReduxLoggerControl.instance;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<ReduxLoggerConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Update entire configuration
   */
  setConfig(config: Partial<ReduxLoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfigToStorage();
    console.log('[REDUX_LOGGER] Config updated:', this.config);
  }

  /**
   * Toggle logging globally
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfigToStorage();
    console.log(`[REDUX_LOGGER] ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Toggle specific feature logging
   */
  setFeatureLogging(feature: keyof ReduxLoggerConfig['featureLogging'], enabled: boolean): void {
    this.config.featureLogging[feature] = enabled;
    this.saveConfigToStorage();
    console.log(`[REDUX_LOGGER] Feature '${feature}' logging ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Check if specific feature logging is enabled
   */
  isFeatureEnabled(feature: keyof ReduxLoggerConfig['featureLogging']): boolean {
    return this.config.enabled && this.config.featureLogging[feature];
  }

  /**
   * Check if specific action should be logged
   */
  shouldLogAction(actionType: string): boolean {
    if (!this.config.enabled) return false;

    const filter = this.config.actionFilter;

    switch (filter.mode) {
      case 'whitelist':
        return filter.actions?.includes(actionType) ?? false;
      case 'blacklist':
        return !filter.actions?.includes(actionType) ?? true;
      case 'all':
      default:
        return true;
    }
  }

  /**
   * Save config to localStorage for persistence
   */
  private saveConfigToStorage(): void {
    try {
      localStorage.setItem('zom2_redux_logger_config', JSON.stringify(this.config));
    } catch (e) {
      console.error('[REDUX_LOGGER] Failed to save config to storage:', e);
    }
  }

  /**
   * Load config from localStorage
   */
  private loadConfigFromStorage(): void {
    try {
      const stored = localStorage.getItem('zom2_redux_logger_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...this.config, ...parsed };
        console.log('[REDUX_LOGGER] Config loaded from storage');
      }
    } catch (e) {
      console.error('[REDUX_LOGGER] Failed to load config from storage:', e);
    }
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...REDUX_LOGGER_CONFIG };
    this.saveConfigToStorage();
    console.log('[REDUX_LOGGER] Config reset to defaults');
  }

  /**
   * Export current config as JSON for debugging
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Print quick status to console
   */
  printStatus(): void {
    console.table({
      enabled: this.config.enabled,
      'Actions': this.config.logActions,
      'State Changes': this.config.logStateChanges,
      'Performance': this.config.enablePerformanceMetrics,
      'Auth Logs': this.config.featureLogging.auth,
      'Cart Logs': this.config.featureLogging.cart,
      'Restaurant Logs': this.config.featureLogging.restaurants,
      'UI Logs': this.config.featureLogging.ui,
    });
  }
}

export const reduxLoggerControl = ReduxLoggerControl.getInstance();

/**
 * BROWSER CONSOLE USAGE (for developers)
 * =======================================
 * 
 * // Get current config
 * reduxLoggerControl.getConfig()
 * 
 * // Toggle globally
 * reduxLoggerControl.setEnabled(false)  // disable all logging
 * reduxLoggerControl.setEnabled(true)   // enable all logging
 * 
 * // Toggle per feature
 * reduxLoggerControl.setFeatureLogging('cart', false)   // disable cart logging
 * reduxLoggerControl.setFeatureLogging('auth', true)    // enable auth logging
 * 
 * // Check status
 * reduxLoggerControl.printStatus()
 * 
 * // Export config
 * console.log(reduxLoggerControl.exportConfig())
 * 
 * // Reset to defaults
 * reduxLoggerControl.reset()
 * 
 * // Set custom filter
 * reduxLoggerControl.setConfig({
 *   actionFilter: {
 *     mode: 'whitelist',
 *     actions: ['@@INIT', 'auth/login', 'cart/addItem']
 *   }
 * })
 */
