/**
 * @vitest-environment jsdom
 */
import { expect, describe, it, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AsyncBoundary } from '../../../shared/components/ui/AsyncState/AsyncBoundary';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import orderReducer, { fetchOrdersThunk, createOrderThunk } from '../../../features/orders/orderSlice';

// Test AsyncBoundary rendering
describe('AsyncBoundary semantics', () => {
  it('renders loadingComponent when status is loading and no data', () => {
    render(
      <AsyncBoundary
        status="loading"
        hasData={false}
        loadingComponent={<div data-testid="loading-comp" />}
        emptyComponent={<div data-testid="empty-comp" />}
      >
        <div data-testid="children" />
      </AsyncBoundary>
    );
    expect(screen.getByTestId('loading-comp')).toBeInTheDocument();
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
  });

  it('renders children with background progress when loading but has data', () => {
    render(
      <AsyncBoundary
        status="loading"
        hasData={true}
        loadingComponent={<div data-testid="loading-comp" />}
        emptyComponent={<div data-testid="empty-comp" />}
      >
        <div data-testid="children" />
      </AsyncBoundary>
    );
    expect(screen.getByTestId('children')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // LinearProgress
  });

  it('renders emptyComponent when success but no data', () => {
    render(
      <AsyncBoundary
        status="success"
        hasData={false}
        loadingComponent={<div data-testid="loading-comp" />}
        emptyComponent={<div data-testid="empty-comp" />}
      >
        <div data-testid="children" />
      </AsyncBoundary>
    );
    expect(screen.getByTestId('empty-comp')).toBeInTheDocument();
  });

  it('renders ErrorState and triggers retry when error', () => {
    const onRetry = vi.fn();
    render(
      <AsyncBoundary
        status="error"
        error="Network failed"
        hasData={false}
        onRetry={onRetry}
        loadingComponent={<div data-testid="loading-comp" />}
        emptyComponent={<div data-testid="empty-comp" />}
      >
        <div data-testid="children" />
      </AsyncBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Network failed')).toBeInTheDocument();
    
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
