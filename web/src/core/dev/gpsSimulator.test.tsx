import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGPSSimulator } from './gpsSimulator';

describe('useGPSSimulator Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exercises the hook deterministically', () => {
    const onLocationUpdate = vi.fn();
    const currentLoc = { lat: 0, lng: 0 };
    const targetLoc = { lat: 10, lng: 10 };

    // 1. Mount the hook with active = false
    const { rerender, unmount } = renderHook(
      ({ isActive }) => useGPSSimulator(isActive, currentLoc, targetLoc, onLocationUpdate),
      { initialProps: { isActive: false } }
    );

    expect(onLocationUpdate).not.toHaveBeenCalled();

    // 2. Activate the hook
    rerender({ isActive: true });

    // Should immediately fire the first position (start location)
    expect(onLocationUpdate).toHaveBeenCalledTimes(1);

    // 3. Advance timers (interval is 2000ms by default in the hook)
    // 20 steps total means 21 points
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onLocationUpdate).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(2000 * 5); // advance 5 more ticks
    });
    expect(onLocationUpdate).toHaveBeenCalledTimes(7);

    // 4. Unmount the hook
    unmount();

    // 5. Advance timers again, ensure no more calls happen
    act(() => {
      vi.advanceTimersByTime(2000 * 5);
    });
    
    // Call count should still be 7
    expect(onLocationUpdate).toHaveBeenCalledTimes(7);
  });
});
