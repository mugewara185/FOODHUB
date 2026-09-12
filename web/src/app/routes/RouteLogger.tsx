import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '../../core/dev/logger';

export const RouteLogger = () => {
  const location = useLocation();
  const previousLocation = useRef(location.pathname);

  useEffect(() => {
    if (previousLocation.current !== location.pathname) {
      logger.info('ROUTE', `Navigating to ${location.pathname}`, {
        event: 'ROUTE.CHANGE.START',
        route: location.pathname,
        data: {
          from: previousLocation.current,
          to: location.pathname,
          search: location.search
        }
      });
      
      logger.setCurrentRoute(location.pathname);
      
      // We log success immediately for standard client-side routing
      logger.info('ROUTE', `Navigated to ${location.pathname}`, {
        event: 'ROUTE.CHANGE.SUCCESS',
        route: location.pathname,
        data: {
          from: previousLocation.current,
          to: location.pathname,
        }
      });

      previousLocation.current = location.pathname;
    }
  }, [location]);

  return null;
};
