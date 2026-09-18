import { useAppDispatch } from '../../../app/store/hooks';
import { addNotification } from '../notificationSlice';
import { useDeliverySocket } from '../../../features/deliveryPartner/hooks/useDeliverySocket';
import type { DeliveryAssignedPayload, DeliveryStatusPayload } from '../../../core/types/socket.events';

type NotificationRole = 'customer' | 'partner' | 'admin';

export const useDeliveryNotifications = (role: NotificationRole) => {
  const dispatch = useAppDispatch();

  useDeliverySocket(role, {
    onAssigned: (payload: DeliveryAssignedPayload) => {
      let title = '';
      let message = '';
      let targetPath = '';

      if (role === 'customer') {
        title = 'Order Assigned';
        message = `Partner ${payload.partnerName} has been assigned to your order.`;
        targetPath = `/orders/tracking/${payload.orderId}`;
      } else if (role === 'partner') {
        title = 'New Delivery';
        message = 'You have been assigned a new delivery.';
        targetPath = '/partner/orders'; // or /partner/active
      } else if (role === 'admin') {
        title = 'Delivery Assigned';
        message = `Order ${payload.orderId} assigned to ${payload.partnerName}.`;
        targetPath = '/admin/delivery';
      }

      dispatch(addNotification({
        title,
        message,
        type: 'info',
        orderId: payload.orderId,
        targetPath
      }));
    },
    onStatus: (payload: DeliveryStatusPayload) => {
      // Stub for delayed / offline (Not currently emitted by backend)
      // TODO: Wire when backend emits 'delayed' or 'offline'
      if (payload.status === 'delayed' || payload.status === 'offline') {
        // e.g. dispatch warning notification for admin
      }

      if (payload.status === 'delivered') {
        if (role === 'customer') {
          dispatch(addNotification({
            title: 'Order Delivered',
            message: 'Your order has been delivered! Enjoy your meal.',
            type: 'success',
            orderId: payload.orderId,
            targetPath: `/orders/tracking/${payload.orderId}`
          }));
        } else if (role === 'admin') {
          dispatch(addNotification({
            title: 'Delivery Complete',
            message: `Delivery for order ${payload.orderId} was completed.`,
            type: 'success',
            orderId: payload.orderId,
            targetPath: '/admin/delivery'
          }));
        }
      } else if (role === 'customer') {
        // Notify customer of other transitions
        const readableStatus = payload.status.replace('_', ' ');
        dispatch(addNotification({
          title: 'Delivery Update',
          message: `Your order is now ${readableStatus}.`,
          type: 'info',
          orderId: payload.orderId,
          targetPath: `/orders/tracking/${payload.orderId}`
        }));
      }
    }
  });
};
