import { test } from 'node:test';
import * as assert from 'node:assert';
import { normalizeError, getErrorMessage } from '../asyncState';
import { ApiClientError } from '../api';

test('normalizeError', async (t) => {
  await t.test('handles ApiClientError with standard data', () => {
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
    assert.strictEqual(normalized.message, 'Validation failed');
    assert.strictEqual(normalized.status, 400);
    assert.strictEqual(normalized.traceId, 'trace-123');
    assert.deepStrictEqual(normalized.details, [{ path: 'email', message: 'Invalid email' }]);
  });

  await t.test('handles ApiClientError with direct details array', () => {
    const error = new ApiClientError('Validation failed', 400, {
      details: [
        { path: 'password', message: 'Too short' }
      ]
    });

    const normalized = normalizeError(error);
    assert.deepStrictEqual(normalized.details, [{ path: 'password', message: 'Too short' }]);
  });

  await t.test('handles standard Error', () => {
    const error = new Error('Network failure');
    const normalized = normalizeError(error);
    assert.strictEqual(normalized.message, 'Network failure');
    assert.strictEqual(normalized.status, undefined);
  });

  await t.test('handles string error', () => {
    const normalized = normalizeError('Something went wrong');
    assert.strictEqual(normalized.message, 'Something went wrong');
  });

  await t.test('handles unknown error type', () => {
    const normalized = normalizeError({ foo: 'bar' });
    assert.strictEqual(normalized.message, 'An unknown error occurred');
  });
});

test('getErrorMessage', async (t) => {
  await t.test('extracts basic message', () => {
    const msg = getErrorMessage({ message: 'Not found', status: 404 });
    assert.strictEqual(msg, 'Not found');
  });

  await t.test('combines validation details if present', () => {
    const msg = getErrorMessage({
      message: 'Validation Error',
      details: [
        { path: 'name', message: 'Required' },
        { path: 'age', message: 'Must be a number' }
      ]
    });
    assert.strictEqual(msg, 'Validation Error: name Required, age Must be a number');
  });

  await t.test('handles null/undefined safely', () => {
    assert.strictEqual(getErrorMessage(null), 'An unknown error occurred');
    assert.strictEqual(getErrorMessage(undefined), 'An unknown error occurred');
  });

  await t.test('handles string safely', () => {
    assert.strictEqual(getErrorMessage('Raw string error'), 'Raw string error');
  });
});
