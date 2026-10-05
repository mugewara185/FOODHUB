import { expect, describe, it } from 'vitest';
import { normalizeError, getErrorMessage } from '../asyncState';
import { ApiClientError } from '../api';

describe('normalizeError', () => {
  it('handles ApiClientError with standard data', () => {
    const error = new ApiClientError('Validation failed', 400, {
      success: false,
      message: 'Validation failed',
      error: {
        details: [
          { path: 'email', message: 'Invalid email' }
        ]
      }
    }, 'trace-123');

    const normalized = normalizeError(error);
    expect(normalized.message).toBe('Validation failed');
    expect(normalized.status).toBe(400);
    expect(normalized.traceId).toBe('trace-123');
    expect(normalized.details).toEqual([{ path: 'email', message: 'Invalid email' }]);
  });

  it('handles ApiClientError with direct details array', () => {
    const error = new ApiClientError('Validation failed', 400, {
      details: [
        { path: 'password', message: 'Too short' }
      ]
    });

    const normalized = normalizeError(error);
    expect(normalized.details).toEqual([{ path: 'password', message: 'Too short' }]);
  });

  it('handles standard Error', () => {
    const error = new Error('Network failure');
    const normalized = normalizeError(error);
    expect(normalized.message).toBe('Network failure');
    expect(normalized.status).toBeUndefined();
  });

  it('handles string error', () => {
    const normalized = normalizeError('Something went wrong');
    expect(normalized.message).toBe('Something went wrong');
  });

  it('handles unknown error type', () => {
    const normalized = normalizeError({ foo: 'bar' });
    expect(normalized.message).toBe('An unknown error occurred');
  });
});

describe('getErrorMessage', () => {
  it('extracts basic message', () => {
    const msg = getErrorMessage({ message: 'Not found', status: 404 });
    expect(msg).toBe('Not found');
  });

  it('combines validation details if present', () => {
    const msg = getErrorMessage({
      message: 'Validation Error',
      details: [
        { path: 'name', message: 'Required' },
        { path: 'age', message: 'Must be a number' }
      ]
    });
    expect(msg).toBe('Validation Error: name Required, age Must be a number');
  });

  it('handles null/undefined safely', () => {
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
    expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
  });

  it('handles string safely', () => {
    expect(getErrorMessage('Raw string error')).toBe('Raw string error');
  });
});
