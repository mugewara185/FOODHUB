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
import { useLogger } from "./core/dev/logger";
//ui-dev:
  //modals
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
  // console.log('%c<App/>','color:orange')
  return (
    // <ErrorBoundary>
    <AuthProvider>
      <Toast/>
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
