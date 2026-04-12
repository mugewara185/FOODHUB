import React from "react";
import {AuthProvider} from './contexts/AuthContext';
import AppRoutes from "./app/routes";
import FloatingDevConsole from "@core/dev/ui/components/FloatingDevConsole";
// import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { CUISINES } from '@core/constants/food';
import { selectAllRestaurants } from "./features/restaurant/restaurantSlice";
import { selectFeaturedRestaurants } from "./features/restaurant/restaurantSlice";
import { selectRestaurantLoading } from "./features/restaurant/restaurantSlice";
import { useAppSelector } from "@app/store/hooks";
import { useDevContext } from "@core/dev/contexts/DevContext";

const App:React.FC =()=>{
    const allRestaurants = useAppSelector(selectAllRestaurants);
    const featuredRestaurants = useAppSelector(selectFeaturedRestaurants);
    const loading = useAppSelector(selectRestaurantLoading);
    const { availableVersions, selectedVersions } = useDevContext();
  // console.log('%c<App/>','color:orange')
  return (
    // <ErrorBoundary>
      <AuthProvider>
        <AppRoutes/>
        {/* Floating Dev Console */}
            <FloatingDevConsole
              allRestaurants={allRestaurants}
              featuredRestaurants={featuredRestaurants}
              loading={loading}
              availableVersions={availableVersions}
              selectedVersions={selectedVersions}
              cuisineLength={CUISINES.length}
            />
      </AuthProvider>
    // </ErrorBoundary>
  )
}

export default App;