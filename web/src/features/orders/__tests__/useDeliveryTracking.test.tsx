import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDeliveryTracking } from './useDeliveryTracking';
import { socketService } from '@/services/socket';
import type { DeliveryAssignedPayload, DeliveryStatusPayload, DeliveryLocationPayload } from '@/core/types/socket.events';

vi.mock('@/services/socket', () => ({
  socketService: {
    onDeliveryAssigned: vi.fn(),
    onDeliveryStatus: vi.fn(),
    onDeliveryLocation: vi.fn(),
    offDeliveryAssigned: vi.fn(),
    offDeliveryStatus: vi.fn(),
    offDeliveryLocation: vi.fn(),
    joinOrderRoom: vi.fn(),
    unsubscribeFromOrder: vi.fn(),
  }
}));

describe('useDeliveryTracking Hook', () => {
  const orderId = 'order-123';
  const restaurantLocation = { lat: 10, lng: 10 };
  const customerLocation = { lat: 20, lng: 20 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupHook = () => {
    const { result, unmount } = renderHook(() => 
      useDeliveryTracking(orderId, 'preparing', restaurantLocation, customerLocation)
    );
    return {
      result,
      unmount,
      onAssigned: vi.mocked(socketService.onDeliveryAssigned).mock.calls[0]?.[0],
      onStatus: vi.mocked(socketService.onDeliveryStatus).mock.calls[0]?.[0],
      onLocation: vi.mocked(socketService.onDeliveryLocation).mock.calls[0]?.[0],
    };
  };

  it('delivery:assigned -> partner info populated', () => {
    const { result, onAssigned } = setupHook();
    
    const assignedPayload: DeliveryAssignedPayload = {
      orderId,
      deliveryId: 'del-123',
      partnerId: 'partner-123',
      partnerName: 'Test Partner',
      partnerPhone: '+1234567890',
      status: 'partner_assigned'
    };
    
    act(() => onAssigned(assignedPayload));

    expect(result.current.partner?.name).toBe('Test Partner');
    expect(result.current.partner?.phone).toBe('+1234567890');
    expect(result.current.status).toBe('partner_assigned');
  });

  it('delivery:location -> lat/lng updated, ETA recalculated', () => {
    const { result, onLocation } = setupHook();
    
    const locationPayload: DeliveryLocationPayload = {
      orderId,
      deliveryId: 'del-123',
      partnerId: 'partner-123',
      location: { lat: 15, lng: 15 }
    };
    
    act(() => onLocation(locationPayload));

    expect(result.current.location?.lat).toBe(15);
    expect(result.current.location?.lng).toBe(15);
    expect(result.current.distance).toBeGreaterThan(0);
    expect(result.current.etaSeconds).toBeGreaterThan(0);
  });

  it('delivery:status -> timeline advanced', () => {
    const { result, onStatus } = setupHook();
    
    const statusPayload: DeliveryStatusPayload = {
      orderId,
      deliveryId: 'del-123',
      partnerId: 'partner-123',
      status: 'picked_up',
      timestamp: new Date().toISOString()
    };
    
    act(() => onStatus(statusPayload));

    expect(result.current.status).toBe('picked_up');
  });

  it('negative case: ignores events meant for another order', () => {
    const { result, onStatus } = setupHook();
    
    const statusPayload: DeliveryStatusPayload = {
      orderId: 'wrong-order-456',
      deliveryId: 'del-123',
      partnerId: 'partner-123',
      status: 'delivered',
      timestamp: new Date().toISOString()
    };
    
    act(() => onStatus(statusPayload));

    // Should remain on the initial status
    expect(result.current.status).toBe('preparing');
  });

  it('unmounts cleanly and unsubscribes from the order', () => {
    const { unmount } = setupHook();
    expect(socketService.joinOrderRoom).toHaveBeenCalledWith(orderId);
    
    unmount();
    expect(socketService.unsubscribeFromOrder).toHaveBeenCalledWith(orderId);
  });
});
