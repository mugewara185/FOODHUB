import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import orderReducer from '../orderSlice';
import deliveryPartnerReducer, { acceptAssignmentThunk } from '../../deliveryPartner/deliveryPartnerSlice';
import LiveDeliveryTracker from '../components/tracking/LiveDeliveryTracker';
import OrderChat from '../../../shared/components/OrderChat/OrderChat';
import api from '../../../core/utils/api';
import { socketService } from '../../../services/socket';

// Mock Map component so Leaflet DOM isn't needed in unit tests
vi.mock('../../../shared/components/maps/Map', () => ({
  default: (props: any) => (
    <div
      data-testid="mock-map"
      data-route-coords={JSON.stringify(props.routeCoordinates || [])}
      data-route-status={props.routeStatus || 'none'}
    >
      Map
    </div>
  ),
}));


describe('Live Delivery, Owner ETA, Partner State & Chat Reproduction Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('Fix A: displays "Partner arrived at restaurant" instead of "Calculating..." when status is arrived_pickup and etaSeconds is 0', async () => {
    let locCallback: any = null;
    vi.spyOn(socketService, 'onDeliveryLocation').mockImplementation((cb) => {
      locCallback = cb;
    });
    vi.spyOn(socketService, 'onDeliveryStatus').mockImplementation(() => {});
    vi.spyOn(socketService, 'onDeliveryAssigned').mockImplementation(() => {});
    vi.spyOn(socketService, 'onOrderChatMessage').mockImplementation(() => {});
    vi.spyOn(socketService, 'joinOrderRoom').mockImplementation(() => {});
    vi.spyOn(socketService, 'unsubscribeFromOrder').mockImplementation(() => {});

    const store = configureStore({
      reducer: {
        orders: orderReducer,
        deliveryPartner: deliveryPartnerReducer,
        auth: (state = { user: { id: 'owner-1', role: ['owner'] } }) => state,
      }
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LiveDeliveryTracker
            orderId="order-eta-1"
            orderStatus="partner_assigned"
            deliveryStatus="arrived_pickup"
            restaurantLocation={{ lat: 12.9716, lng: 77.5946 }}
            customerLocation={{ lat: 12.9916, lng: 77.6146 }}
            initialPartner={{ id: 'p-1', name: 'Rahul Mehta', phone: '9876543210' }}
            initialLocation={{ lat: 12.9716, lng: 77.5946 }}
            initialEtaSeconds={0}
            initialDistance={0}
          />
        </MemoryRouter>
      </Provider>
    );

    // Also simulate a live delivery:location tick at arrived_pickup with etaSeconds = 0
    if (locCallback) {
      act(() => {
        locCallback({
          orderId: 'order-eta-1',
          deliveryId: 'del-eta-1',
          partnerId: 'p-1',
          location: { lat: 12.9716, lng: 77.5946 },
          status: 'arrived_pickup',
          etaSeconds: 0,
          distanceRemainingMeters: 0,
        });
      });
    }

    expect(screen.queryByText('Calculating...')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Partner arrived at restaurant/i).length).toBeGreaterThanOrEqual(1);
  });

  it('Fix C: acceptAssignmentThunk populates currentLocation and activeAssignment.currentLocation from backend GeoJSON coordinates', async () => {
    const store = configureStore({
      reducer: {
        deliveryPartner: deliveryPartnerReducer,
        auth: (state = { user: { id: 'partner-1', role: ['partner'] } }) => state,
      },
      preloadedState: {
        deliveryPartner: {
          id: 'p-1',
          name: 'Rahul',
          phone: '999',
          vehicle: 'Bike',
          rating: 4.8,
          status: 'ONLINE' as const,
          isOnline: true,
          currentLocation: { lat: 0, lng: 0 },
          activeAssignment: null,
          availableAssignments: [],
          earnings: { today: 0, week: 0, month: 0, completedToday: 0 },
          deliveryHistory: [],
          isLoading: false,
          error: null,
          recenterTrigger: 0,
          routePoints: [],
        }
      }
    });

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          _id: 'del-999',
          orderId: 'order-999',
          partnerId: 'p-1',
          status: 'partner_assigned',
          pickupLocation: { type: 'Point', coordinates: [77.5946, 12.9716] },
          destinationLocation: { type: 'Point', coordinates: [77.6146, 12.9916] },
          currentLocation: { type: 'Point', coordinates: [77.5900, 12.9680] },
          etaSeconds: 95,
          distanceRemainingMeters: 650,
        }
      })
    } as Response);

    await act(async () => {
      await store.dispatch(acceptAssignmentThunk({ orderId: 'order-999' }));
    });

    const state = store.getState().deliveryPartner;
    expect(state.currentLocation.lat).toBeCloseTo(12.9680, 4);
    expect(state.currentLocation.lng).toBeCloseTo(77.5900, 4);
    expect(state.activeAssignment?.currentLocation?.lat).toBeCloseTo(12.9680, 4);
    expect(state.activeAssignment?.currentLocation?.lng).toBeCloseTo(77.5900, 4);
  });

  it('Fix D: OrderChat merges late-arriving HTTP chat history without overwriting live socket messages', async () => {
    let chatSocketHandler: any = null;
    vi.spyOn(socketService, 'onOrderChatMessage').mockImplementation((cb) => {
      chatSocketHandler = cb;
    });
    vi.spyOn(socketService, 'offOrderChatMessage').mockImplementation(() => {});
    vi.spyOn(socketService, 'joinOrderRoom').mockImplementation(() => {});

    let resolveHistoryPromise: (val: any) => void = () => {};
    vi.spyOn(api, 'get').mockImplementation(() => new Promise((resolve) => {
      resolveHistoryPromise = resolve;
    }));

    const store = configureStore({
      reducer: {
        orders: orderReducer,
        auth: (state = { user: { id: 'partner-1', role: ['partner'] } }) => state,
      }
    });

    render(
      <Provider store={store}>
        <OrderChat
          open={true}
          onClose={() => {}}
          orderId="ord-chat-race"
          currentUserRole="partner"
          targetRole="user"
          targetName="Customer"
        />
      </Provider>
    );

    // 1. Live socket message arrives BEFORE HTTP history resolves
    act(() => {
      chatSocketHandler?.({
        _id: 'msg-live-2',
        clientMessageId: 'cid-live-2',
        orderId: 'ord-chat-race',
        senderId: 'cust-1',
        senderRole: 'user',
        targetRole: 'partner',
        message: 'Live message arrived during HTTP fetch!',
        timestamp: new Date(Date.now() + 5000).toISOString(),
      });
    });

    expect(screen.getByText('Live message arrived during HTTP fetch!')).toBeInTheDocument();

    // 2. Late HTTP history resolves with an older message only
    await act(async () => {
      resolveHistoryPromise([
        {
          _id: 'msg-hist-1',
          clientMessageId: 'cid-hist-1',
          orderId: 'ord-chat-race',
          senderId: 'partner-1',
          senderRole: 'partner',
          targetRole: 'user',
          message: 'Older history message from DB',
          timestamp: new Date(Date.now() - 10000).toISOString(),
        }
      ]);
    });

    // Both messages must be visible (live message was NOT overwritten by history hydration!)
    expect(screen.getByText('Older history message from DB')).toBeInTheDocument();
    expect(screen.getByText('Live message arrived during HTTP fetch!')).toBeInTheDocument();
  });

  it('LiveDeliveryTracker remaining route starts at courier location for pickup leg and customer leg', async () => {
    let locCallback: any = null;
    let statusCallback: any = null;
    vi.spyOn(socketService, 'onDeliveryLocation').mockImplementation((cb) => {
      locCallback = cb;
    });
    vi.spyOn(socketService, 'onDeliveryStatus').mockImplementation((cb) => {
      statusCallback = cb;
    });
    vi.spyOn(socketService, 'onDeliveryAssigned').mockImplementation(() => {});
    vi.spyOn(socketService, 'onOrderChatMessage').mockImplementation(() => {});
    vi.spyOn(socketService, 'joinOrderRoom').mockImplementation(() => {});
    vi.spyOn(socketService, 'unsubscribeFromOrder').mockImplementation(() => {});

    const store = configureStore({
      reducer: {
        orders: orderReducer,
        deliveryPartner: deliveryPartnerReducer,
        auth: (state = { user: { id: 'user-1', role: ['user'] } }) => state,
      }
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <LiveDeliveryTracker
            orderId="order-route-1"
            orderStatus="partner_assigned"
            deliveryStatus="partner_assigned"
            restaurantLocation={{ lat: 12.9716, lng: 77.5946 }}
            customerLocation={{ lat: 12.9916, lng: 77.6146 }}
            initialPartner={{ id: 'p-1', name: 'Rahul Mehta', phone: '9876543210' }}
            initialLocation={{ lat: 12.9680, lng: 77.5900 }}
            initialEtaSeconds={300}
            initialDistance={1500}
          />
        </MemoryRouter>
      </Provider>
    );

    const mapEl = screen.getByTestId('mock-map');
    const leg1Coords = JSON.parse(mapEl.getAttribute('data-route-coords') || '[]');
    expect(leg1Coords.length).toBeGreaterThanOrEqual(2);
    // Leg 1: courier heading to restaurant (12.9680 -> 12.9716)
    expect(leg1Coords[0].lat).toBeCloseTo(12.9680, 3);
    expect(leg1Coords[leg1Coords.length - 1].lat).toBeCloseTo(12.9716, 3);

    // Transition to picked_up with new courier position via live socket event
    act(() => {
      locCallback?.({
        orderId: 'order-route-1',
        location: { lat: 12.9750, lng: 77.5980 },
        status: 'picked_up',
        etaSeconds: 200,
        distanceRemainingMeters: 800,
      });
      statusCallback?.({
        orderId: 'order-route-1',
        status: 'picked_up',
        location: { lat: 12.9750, lng: 77.5980 },
      });
    });

    const leg2Coords = JSON.parse(mapEl.getAttribute('data-route-coords') || '[]');
    expect(leg2Coords.length).toBeGreaterThanOrEqual(2);
    // Leg 2: starts at courier position (12.9750), destination is customer (12.9916)
    expect(leg2Coords[0].lat).toBeCloseTo(12.9750, 3);
    expect(leg2Coords[leg2Coords.length - 1].lat).toBeCloseTo(12.9916, 3);

    // Terminal delivered event
    act(() => {
      statusCallback?.({
        orderId: 'order-route-1',
        status: 'delivered',
        location: { lat: 12.9916, lng: 77.6146 },
      });
    });

    const deliveredCoords = JSON.parse(mapEl.getAttribute('data-route-coords') || '[]');
    expect(deliveredCoords).toHaveLength(0);
    expect(mapEl.getAttribute('data-route-status')).toBe('none');
  });
});

