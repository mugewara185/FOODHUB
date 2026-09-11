/**
 * Redux Logger Middleware
 * =======================
 * 
 * Middleware that logs all Redux actions and state changes
 * Uses centralized configuration for fine-grained control
 * Integrates with the global logger system
 * 
 * Philosophy:
 * - Log actions and state changes in structured format
 * - Track performance of reducers
 * - Identify slow actions
 * - Persist logs for debugging
 */

import type { Middleware } from '@reduxjs/toolkit';
import { logger, logRedux } from '../../../core/dev/logger';
import { reduxLoggerControl, type ReduxLoggerConfig } from './reduxLogger.config';
import type { RootState } from './stateInitializers';

/**
 * Utilities for Redux logging
 */
const reduxLoggerUtils = {
  /**
   * Extract feature name from action type (e.g., 'auth/login' -> 'auth')
   */
  getFeatureFromAction: (actionType: string): keyof ReduxLoggerConfig['featureLogging'] => {
    const feature = actionType.split('/')[0];
    return feature as keyof ReduxLoggerConfig['featureLogging'];
  },

  /**
   * Mask sensitive data in objects
   */
  maskSensitiveData: (data: unknown, sensitiveKeys: string[] = []): unknown => {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map(item => reduxLoggerUtils.maskSensitiveData(item, sensitiveKeys));
    }

    const masked = { ...data } as Record<string, unknown>;
    sensitiveKeys.forEach(key => {
      if (key in masked) {
        masked[key] = '***MASKED***';
      }
    });
    return masked;
  },

  /**
   * Truncate large objects
   */
  truncateData: (data: unknown, maxSize: number = 1000): unknown => {
    const str = JSON.stringify(data);
    if (str?.length > maxSize) {
      return JSON.parse(str.substring(0, maxSize)) + '...[TRUNCATED]';
    }
    return data;
  },

  /**
   * Pretty log object
   */
  formatLog: (obj: Record<string, unknown>): void => {
    console.group(`%c[REDUX] ${obj.action || obj.category}`, 'color: #1976d2; font-weight: bold');
    console.log('Timestamp:', new Date(obj.timestamp as number).toISOString());
    if (obj.duration) console.log('Duration:', `${obj.duration}ms`);
    if (obj.payload) console.log('Payload:', obj.payload);
    if (obj.previousState) console.log('Previous State:', obj.previousState);
    if (obj.nextState) console.log('Next State:', obj.nextState);
    if (obj.diff) console.log('State Diff:', obj.diff);
    if (obj.warning) console.warn('⚠️ Warning:', obj.warning);
    console.groupEnd();
  },

  /**
   * Calculate shallow diff between two state objects
   */
  calculateDiff: (prev: Record<string, unknown>, next: Record<string, unknown>): Record<string, { from: unknown; to: unknown }> => {
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

    allKeys.forEach(key => {
      if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
        diff[key] = {
          from: prev[key],
          to: next[key],
        };
      }
    });

    return diff;
  },
};

/**
 * Create Redux logger middleware
 */
export const createReduxLoggerMiddleware = (): Middleware<{}, RootState> => {
  return (store) => (next) => (action) => {
    const config = reduxLoggerControl.getConfig();

    // Check if logging is enabled
    if (!config.enabled) {
      return next(action);
    }

    // Check if this action type should be logged
    if (!reduxLoggerControl.shouldLogAction(action.type)) {
      return next(action);
    }

    const actionType = action.type as string;
    const feature = reduxLoggerUtils.getFeatureFromAction(actionType);

    // Check if feature logging is enabled
    if (!reduxLoggerControl.isFeatureEnabled(feature)) {
      return next(action);
    }

    // Prepare log data
    const logData: Record<string, unknown> = {
      action: actionType,
      timestamp: Date.now(),
    };

    // Log action
    if (config.logActions) {
      let payload = action.payload;

      if (config.filterSensitiveData && config.sensitiveKeys) {
        payload = reduxLoggerUtils.maskSensitiveData(payload, config.sensitiveKeys);
      }

      if (config.maxPayloadSize) {
        payload = reduxLoggerUtils.truncateData(payload, config.maxPayloadSize);
      }

      if (config.logPayloadData) {
        logData.payload = payload;
      }

      logRedux.action(actionType, payload);
    }

    // Get previous state (before reducer runs)
    let previousState: RootState | undefined;
    if (config.logPreviousState) {
      previousState = store.getState();
      logData.previousState = previousState;
    }

    // Measure action duration
    let startTime = 0;
    if (config.enablePerformanceMetrics || config.logDuration) {
      startTime = performance.now();
    }

    // Execute the action
    const result = next(action);

    // Get next state (after reducer runs)
    let nextState: RootState | undefined;
    let duration = 0;

    if (config.logNextState || config.logDiff || config.logDuration) {
      nextState = store.getState();

      if (config.logNextState) {
        logData.nextState = nextState;
      }

      // Calculate state diff
      if (config.logDiff && previousState) {
        const diff = reduxLoggerUtils.calculateDiff(previousState as Record<string, unknown>, nextState as Record<string, unknown>);
        if (Object.keys(diff).length > 0) {
          logData.diff = diff;
        }
      }
    }

    // Calculate duration
    if (config.enablePerformanceMetrics || config.logDuration) {
      duration = performance.now() - startTime;
      logData.duration = duration;

      if (config.enableSlowActionWarning && duration > config.slowActionThreshold) {
        const warning = `Action took ${duration}ms (threshold: ${config.slowActionThreshold}ms)`;
        logData.warning = warning;
        logger.warn('REDUX', warning, { data: { action: actionType, duration }, source: 'ReduxMiddleware' });
      }
    }

    // Log state changes
    if (config.logStateChanges && previousState && nextState) {
      logRedux.state(feature, logData);
    }

    // Dispatch dispatch event and write to logger
    logData.source = 'ReduxMiddleware';
    logger.debug('REDUX', `Action: ${actionType}`, { data: logData, source: 'Redux' });

    // Pretty print if configured
    if (config.prettyPrint) {
      reduxLoggerUtils.formatLog(logData as Record<string, unknown>);
    }

    return result;
  };
};

/**
 * Export utilities for use elsewhere
 */
export const reduxLoggerUtils_export = reduxLoggerUtils;
