import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./app/routes";
import FloatingDevConsole from "@/core/dev/ui/modals/FloatingDevConsole";
// import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { CUISINES } from "@core/constants/food";
import { selectAllRestaurants } from "./features/restaurant/restaurantSlice";
import { selectFeaturedRestaurants } from "./features/restaurant/restaurantSlice";
import { selectRestaurantLoading } from "./features/restaurant/restaurantSlice";
import { useAppSelector } from "@app/store/hooks";
//context
import { useDevContext } from "@core/dev/contexts/DevContext";
import { useLogger, logger } from "./core/dev/logger";
import LogConsole from "./core/dev/logger";
import { APP_CONFIG } from "./core/config/app.config";
//ui-shared
import { Toast } from "./shared/components/notifications";

const App: React.FC = () => {
  const allRestaurants = useAppSelector(selectAllRestaurants);
  const featuredRestaurants = useAppSelector(selectFeaturedRestaurants);
  const loading = useAppSelector(selectRestaurantLoading);
  const { availableVersions, selectedVersions } = useDevContext();
  const { open: LogConsoleOpen, setOpen: setLogConsoleOpen } = useLogger();

  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialized } = useAppSelector(state => state.auth);

  useEffect(() => {
    logger.info('APP', 'FoodHub application initialized', { event: 'APP.INIT', source: 'App' });
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      const socket = socketService.connect(user.id);

      const handleNotification = (data: { title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', orderId?: string, status?: string }) => {
        const notifType = data.type || 'info';
        // Transient UI Toast
        dispatch(showToast({ message: data.message, type: notifType }));
        // Persistent In-App Notification
        dispatch(addNotification({
          title: data.title,
          message: data.message,
          type: notifType,
          orderId: data.orderId,
          status: data.status
        }));
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
      socketService.disconnect();
    }
  }, [isAuthenticated, isInitialized, user?.id, dispatch]);

  return (
    // <ErrorBoundary>
    <AuthProvider>
      <Toast />
      <AppRoutes />
      {/* Floating Dev Console */}
      {APP_CONFIG.DEV_BYPASS_AUTH && (
        <FloatingDevConsole
          allRestaurants={allRestaurants}
          featuredRestaurants={featuredRestaurants}
          loading={loading}
          availableVersions={availableVersions}
          selectedVersions={selectedVersions}
          cuisineLength={CUISINES.length}
        />
      )}
      {/* Logger-Console    */}
      <LogConsole
        open={LogConsoleOpen}
        onClose={() => {
          setLogConsoleOpen(false);
        }}
      />
    </AuthProvider>

    // </ErrorBoundary>
  );
};

export default App;
