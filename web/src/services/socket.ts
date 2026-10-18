import { appConfig } from '../core/config/app.config';
import { io, Socket } from "socket.io-client";
import { logger } from "../core/utils/logger";
import { getAuthToken } from "./api/apiUtils";
import type {
  DeliveryAssignedPayload,
  DeliveryStatusPayload,
  DeliveryLocationPayload,
  PartnerLocationUpdatedPayload, OrderChatMessage,
} from "../core/types/socket.events";

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | undefined;
  private activeOrderRooms: Set<string> = new Set();
  private registeredListeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private connectionChangeListeners: Set<
    (status: "connected" | "reconnecting" | "disconnected") => void
  > = new Set();

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  private addListener(event: string, callback: (...args: any[]) => void) {
    if (!this.registeredListeners.has(event)) {
      this.registeredListeners.set(event, new Set());
    }
    this.registeredListeners.get(event)!.add(callback);
    if (this.socket) {
      this.socket.off(event, callback);
      this.socket.on(event, callback);
    }
  }

  private removeListener(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.registeredListeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    } else {
      this.registeredListeners.delete(event);
      this.socket?.off(event);
    }
  }

  connect(userId?: string, role?: string) {
    if (userId) {
      this.currentUserId = userId;
    }

    if (this.socket) {
      if (this.currentUserId) {
        if (this.socket.connected) {
          this.joinUserRoom(this.currentUserId);
        } else {
          this.socket.once("connect", () => {
            if (this.currentUserId) this.joinUserRoom(this.currentUserId);
          });
        }
      }
      if (this.socket.connected) {
        this.activeOrderRooms.forEach((roomId) => {
          this.socket?.emit("join_order_room", roomId);
        });
      }
      return this.socket;
    }

    const token = getAuthToken();
    this.socket = io(
      appConfig.api.socketUrl || (typeof window !== "undefined" ? window.location.origin : ""),
      {
        transports: ["websocket", "polling"],
        auth: {
          token: token || undefined,
          userId: userId || undefined,
          role: role || undefined,
          devBypass: true,
        },
      },
    );

    // Attach any listeners that were registered before connect() was called
    this.registeredListeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.off(event, cb);
        this.socket?.on(event, cb);
      });
    });

    this.socket.on("connect", () => {
      console.log(
        "Socket connected:",
        this.socket?.id,
        role ? `(Role: ${role})` : "Role:no role specified!!!",
      );
      this.notifyConnectionState("connected");
      if (this.currentUserId) {
        this.socket?.emit("join_user_room", this.currentUserId);
      }
      this.activeOrderRooms.forEach((roomId) => {
        this.socket?.emit("join_order_room", roomId);
      });
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.notifyConnectionState("disconnected");
    });

    this.socket.on("connect_error", () => {
      this.notifyConnectionState("reconnecting");
    });

    this.socket.io.on("reconnect_attempt", () => {
      this.notifyConnectionState("reconnecting");
    });

    return this.socket;
  }

  private notifyConnectionState(
    status: "connected" | "reconnecting" | "disconnected",
  ) {
    this.connectionChangeListeners.forEach((listener) => listener(status));
  }

  onConnectionChange(
    callback: (status: "connected" | "reconnecting" | "disconnected") => void,
  ) {
    this.connectionChangeListeners.add(callback);
    // Immediately invoke with current status if socket exists
    if (this.socket) {
      if (this.socket.connected) callback("connected");
      else callback("disconnected"); // or reconnecting, but disconnected is safer
    }
  }

  offConnectionChange(
    callback: (status: "connected" | "reconnecting" | "disconnected") => void,
  ) {
    this.connectionChangeListeners.delete(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.notifyConnectionState("disconnected");
    }
  }

  joinUserRoom(userId: string) {
    if (!userId) return;
    this.currentUserId = userId;
    this.socket?.emit("join_user_room", userId);
  }

  joinOrderRoom(orderId: string) {
    if (!orderId) return;
    this.activeOrderRooms.add(orderId);
    this.socket?.emit("join_order_room", orderId);
  }

  subscribeToOrder(orderId: string, callback?: (data: any) => void) {
    this.joinOrderRoom(orderId);
    if (callback) {
      this.addListener("order_status_update", callback);
      this.addListener("order:status_changed", callback);
      this.addListener("partner:location_updated", callback);
      this.addListener("delivery:assigned", callback);
      this.addListener("delivery:location", callback);
      this.addListener("delivery:status", callback);
    }
  }

  unsubscribeFromOrder(orderId: string, callback?: (data: any) => void) {
    if (orderId) {
      this.activeOrderRooms.delete(orderId);
      this.socket?.emit("leave_order_room", orderId);
    }
    if (callback) {
      this.removeListener("order_status_update", callback);
      this.removeListener("order:status_changed", callback);
      this.removeListener("partner:location_updated", callback);
      this.removeListener("delivery:assigned", callback);
      this.removeListener("delivery:location", callback);
      this.removeListener("delivery:status", callback);
    }
  }

  joinAdminFleet() {
    this.socket?.emit("join_admin_fleet");
  }

  leaveAdminFleet() {
    this.socket?.emit("leave_admin_fleet");
  }

  onAdminFleetEvent(event: string, callback: (data: any) => void) {
    this.addListener(event, callback);
  }

  updatePartnerLocation(
    ids: { deliveryId: string; orderId: string; partnerId: string },
    location: { lat: number; lng: number },
  ) {
    this.socket?.emit("partner:location_updated", {
      deliveryId: ids.deliveryId,
      orderId: ids.orderId,
      partnerId: ids.partnerId,
      location,
    });
  }

  // Legacy fallback to be refactored eventually
  updateOrderStatus(orderId: string, status: string, location?: any) {
    this.socket?.emit("order_status_update", { orderId, status, location });
  }

  // Type-safe listeners
  onDeliveryAssigned(callback: (payload: DeliveryAssignedPayload) => void) {
    this.addListener("delivery:assigned", callback);
  }

  onDeliveryStatus(callback: (payload: DeliveryStatusPayload) => void) {
    this.addListener("delivery:status", callback);
  }

  onDeliveryLocation(callback: (payload: DeliveryLocationPayload) => void) {
    this.addListener("delivery:location", callback);
  }

  offDeliveryLocation(callback?: (payload: DeliveryLocationPayload) => void) {
    this.removeListener("delivery:location", callback);
  }

  onPartnerLocationUpdated(
    callback: (payload: PartnerLocationUpdatedPayload) => void,
  ) {
    this.addListener("partner:location_updated", callback);
  }

  offDeliveryAssigned(callback?: (payload: DeliveryAssignedPayload) => void) {
    this.removeListener("delivery:assigned", callback);
  }

  offDeliveryStatus(callback?: (payload: DeliveryStatusPayload) => void) {
    this.removeListener("delivery:status", callback);
  }

  // Others
  onOrderStatusUpdate(
    callback: (data: { orderId: string; status: string }) => void,
  ) {
    this.addListener("order_status_update", callback);
  }

  onNotification(
    callback: (data: {
      title: string;
      message: string;
      orderId: string;
      status: string;
    }) => void,
  ) {
    this.addListener("notification", callback);
  }

  offNotification(callback?: (data: any) => void) {
    this.removeListener("notification", callback);
  }

  offOrderStatusUpdate(callback?: (data: any) => void) {
    this.removeListener("order_status_update", callback);
  }

  onDeliveryStatusChanged(callback: (data: any) => void) {
    this.addListener("delivery:status", callback);
  }

  offDeliveryStatusChanged(callback?: (data: any) => void) {
    this.removeListener("delivery:status", callback);
  }

  onOrderStatusChanged(callback: (data: any) => void) {
    this.addListener("order:status_changed", callback);
  }

  offOrderStatusChanged(callback?: (data: any) => void) {
    this.removeListener("order:status_changed", callback);
  }

  onOrderNew(callback: (data: { orderId: string; status: string; [key: string]: any }) => void) {
    this.addListener("order:new", callback);
  }

  offOrderNew(callback?: (data: any) => void) {
    this.removeListener("order:new", callback);
  }

  onDeliveryAvailable(callback: (data: any) => void) {
    this.addListener("delivery:available", callback);
  }

  offDeliveryAvailable(callback?: (data: any) => void) {
    this.removeListener("delivery:available", callback);
  }

  sendOrderChatMessage(payload: OrderChatMessage) {
    if (payload?.orderId) {
      this.joinOrderRoom(payload.orderId);
    }
    this.socket?.emit("order:chat:send", payload);
  }

  onOrderChatMessage(callback: (payload: OrderChatMessage) => void) {
    this.addListener("order:chat:message", callback);
  }

  offOrderChatMessage(callback?: (payload: OrderChatMessage) => void) {
    this.removeListener("order:chat:message", callback);
  }

  removeAllListeners() {
    this.registeredListeners.clear();
    this.socket?.removeAllListeners();
  }
}

export const socketService = new SocketService();



