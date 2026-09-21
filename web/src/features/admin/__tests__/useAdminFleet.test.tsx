import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdminFleet } from '../hooks/useAdminFleet';
import { socketService } from '@/services/socket';
import { api } from '@/core/utils/api';
import type { DeliveryAssignedPayload, DeliveryStatusPayload, DeliveryLocationPayload } from '@/core/types/socket.events';

vi.mock('@/services/socket', () => ({
  socketService: {
    onDeliveryAssigned: vi.fn(),
    onDeliveryStatus: vi.fn(),
    onDeliveryLocation: vi.fn(),
    offDeliveryAssigned: vi.fn(),
    offDeliveryStatus: vi.fn(),
    offDeliveryLocation: vi.fn(),
    joinAdminFleet: vi.fn(),
    leaveAdminFleet: vi.fn(),
    onConnectionChange: vi.fn(),
    offConnectionChange: vi.fn(),
  }
}));

vi.mock('@/core/utils/api', () => ({
  api: {
    get: vi.fn()
  }
}));

describe('useAdminFleet Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupHook = async () => {
    // Mock the API initial snapshot fetch
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          partners: [{
            id: 'partner-1',
            name: 'Test Partner',
            phone: '1234567890',
            vehicle: 'bike',
            rating: 5,
            status: 'online', // or available
            currentLocation: { lat: 10, lng: 10 }
          }]
        }
      }
    });

    let resultContainer: any;
    
    await act(async () => {
      resultContainer = renderHook(() => useAdminFleet());
    });

    const { result, unmount } = resultContainer;

    return {
      result,
      unmount,
      onAssigned: vi.mocked(socketService.onDeliveryAssigned).mock.calls[0]?.[0],
      onStatus: vi.mocked(socketService.onDeliveryStatus).mock.calls[0]?.[0],
      onLocation: vi.mocked(socketService.onDeliveryLocation).mock.calls[0]?.[0],
    };
  };

  it('mounts, fetches snapshot, and updates on delivery lifecycle events', async () => {
    const { result, onAssigned, onLocation, onStatus } = await setupHook();
    
    // 1. Initial Snapshot
    expect(result.current.loading).toBe(false);
    expect(result.current.fleet).toHaveLength(1);
    expect(result.current.fleet[0].name).toBe('Test Partner');
    expect(result.current.fleet[0].status).toBe('online');

    // 2. delivery:assigned
    const assignedPayload: DeliveryAssignedPayload = {
      orderId: 'order-1',
      deliveryId: 'del-1',
      partnerId: 'partner-1',
      partnerName: 'Test Partner',
      partnerPhone: '1234567890',
      status: 'partner_assigned'
    };
    
    act(() => onAssigned(assignedPayload));
    
    let partner = result.current.fleet[0];
    expect(partner.status).toBe('partner_assigned');
    expect(partner.currentAssignedDelivery).toBe('del-1');

    // 3. delivery:location
    const locationPayload: DeliveryLocationPayload = {
      orderId: 'order-1',
      deliveryId: 'del-1',
      partnerId: 'partner-1',
      location: { lat: 15, lng: 15 }
    };
    
    act(() => onLocation(locationPayload));
    
    partner = result.current.fleet[0];
    expect(partner.currentLocation.lat).toBe(15);
    expect(partner.currentLocation.lng).toBe(15);

    // 4. delivery:status -> delivered
    const statusPayload: DeliveryStatusPayload = {
      orderId: 'order-1',
      deliveryId: 'del-1',
      partnerId: 'partner-1',
      status: 'delivered',
      timestamp: new Date().toISOString()
    };
    
    act(() => onStatus(statusPayload));
    
    partner = result.current.fleet[0];
    // Assert all three parts of the contract
    expect(result.current.fleet).toHaveLength(1); // Partner remains in the fleet (still online)
    expect(partner.status).toBe('available'); // Partner.status flips on_delivery/assigned -> available
    expect(partner.currentAssignedDelivery).toBeUndefined(); // Partner.activeDeliveryId clears
  });
});
