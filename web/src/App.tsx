import React, { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./app/routes";
import FloatingDevConsole from "@/core/dev/ui/modals/FloatingDevConsole";
import { CUISINES } from "@core/constants/food";
import { selectAllRestaurants, selectFeaturedRestaurants, selectRestaurantLoading } from "./features/restaurant/restaurantSlice";
import { useAppSelector, useAppDispatch } from "@app/store/hooks";
import { useDevContext } from "@core/dev/contexts/DevContext";
import { useLogger } from "./core/dev/logger";
import LogConsole from "./core/dev/logger";
import { APP_CONFIG } from "./core/config/app.config";
import { Toast } from "./shared/components/notifications";
import { socketService } from "./services/socket";
import { showToast } from "./features/ui/uiSlice";
import { updateOrderStatusLocally } from "./features/orders/orderSlice";

const App: React.FC = () => {
  const allRestaurants = useAppSelector(selectAllRestaurants);
  const featuredRestaurants = useAppSelector(selectFeaturedRestaurants);
  const loading = useAppSelector(selectRestaurantLoading);
  const { availableVersions, selectedVersions } = useDevContext();
  const { open: LogConsoleOpen, setOpen: setLogConsoleOpen } = useLogger();
  
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialized } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      const socket = socketService.connect(user.id);
      
      const handleNotification = (data: { title: string, message: string }) => {
        dispatch(showToast({ message: data.message, type: 'info' }));
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
    <AuthProvider>
      <Toast/>
      <AppRoutes />
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
      <LogConsole
        open={LogConsoleOpen}
        onClose={() => setLogConsoleOpen(false)}
      />
    </AuthProvider>
  );
};

export default App;
