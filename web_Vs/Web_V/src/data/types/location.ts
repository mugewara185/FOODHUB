// ============================================================================
// LOCATION & DELIVERY TYPES (Re-exported from core)
// ============================================================================
// This file is deprecated. All types are now centralized in src/core/types/index.ts
// Use imports from core/types directly instead:
//   import type { Coordinates, DeliveryPartner, LiveTracking } from '@/core/types'

export {
  type Coordinates,
  type DeliveryPartner,
  type LiveTracking,
} from '../../core/types';

// FUTURE: Additional location/geospatial utilities can be added here when implementing:
// - Route optimization
// - Geofencing
// - Map-based searches
// - Delivery zone management