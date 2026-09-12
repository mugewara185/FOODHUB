import React, { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./app/routes";
import FloatingDevConsole from "@/core/dev/ui/modals/FloatingDevConsole";
import { CUISINES } from "@core/constants/food";
import { selectAllRestaurants } from "./features/restaurant/restaurantSlice";
import { selectFeaturedRestaurants } from "./features/restaurant/restaurantSlice";
import { selectRestaurantLoading } from "./features/restaurant/restaurantSlice";
import { useAppDispatch, useAppSelector } from "@app/store/hooks";
//context
import { useDevContext } from "@core/dev/contexts/DevContext";
import { useLogger, logger } from "./core/dev/logger";
import LogConsole from "./core/dev/logger";
import { APP_CONFIG } from "./core/config/app.config";
import { Toast } from "./shared/components/notifications";
import { socketService } from "./services/socket";
import { showToast } from "./features/ui/uiSlice";
import { updateOrderStatusLocally } from "./features/orders/orderSlice";
import { RoleSwitcher } from "./core/ui/role/RoleSwitcher";

const App: React.FC = () => {
  const allRestaurants = useAppSelector(selectAllRestaurants);
  const featuredRestaurants = useAppSelector(selectFeaturedRestaurants);
  const loading = useAppSelector(selectRestaurantLoading);
  const { availableVersions, selectedVersions } = useDevContext();
  const { open: LogConsoleOpen, setOpen: setLogConsoleOpen } = useLogger();

  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialized } = useAppSelector(state => state.auth);

  useEffect(() => {
    logger.info('APP', 'Application Ready', { event: 'APP.READY' });
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      logger.info('SOCKET', 'Connecting socket', { event: 'SOCKET.CONNECT.START', data: { userId: user.id } });
      socketService.connect(user.id);
      logger.info('SOCKET', 'Socket connected', { event: 'SOCKET.CONNECT.SUCCESS' });

      const handleNotification = (data: { title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', orderId?: string, status?: string }) => {
        const notifType = data.type || 'info';
        // Transient UI Toast
        dispatch(showToast({ message: data.message, type: notifType }));
        logger.info('APP', 'Notification received via socket', { event: 'NOTIFICATION.RECEIVED', data });
      };


      const handleOrderStatusUpdate = (data: { orderId: string, status: any }) => {
        dispatch(updateOrderStatusLocally(data));
      };

      socketService.onNotification(handleNotification);
      socketService.onOrderStatusUpdate(handleOrderStatusUpdate);

      return () => {
        socketService.offNotification(handleNotification);
        socketService.offOrderStatusUpdate(handleOrderStatusUpdate);
      };
    } else if (isInitialized && !isAuthenticated) {
      logger.info('SOCKET', 'Disconnecting socket', { event: 'SOCKET.DISCONNECT' });
      socketService.disconnect();
    }
  }, [isAuthenticated, isInitialized, user?.id, dispatch]);

  return (
    <AuthProvider>
      <Toast />
      <AppRoutes />
      {(APP_CONFIG.DEV_BYPASS_AUTH || user?.role.includes('dev')) && (
        <FloatingDevConsole
          allRestaurants={allRestaurants}
          featuredRestaurants={featuredRestaurants}
          loading={loading}
          availableVersions={availableVersions}
          selectedVersions={selectedVersions}
          cuisineLength={CUISINES.length}
        />
      )}
      <RoleSwitcher />
      <LogConsole
        open={LogConsoleOpen}
        onClose={() => setLogConsoleOpen(false)}
      />
    </AuthProvider>
  );
};

export default App;
