export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  address: string;
  coordinates: Coordinates;
  placeId?: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  vehicleType: 'bike' | 'scooter' | 'car';
  vehicleNumber: string;
  currentLocation: Coordinates;
  status: 'online' | 'offline' | 'on_delivery';
  rating: number;
  completedDeliveries: number;
  lastUpdate: Date;
}

export interface DeliveryRoute {
  pickup: Location;
  dropoff: Location;
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string;
  steps: DeliveryStep[];
}

export interface DeliveryStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: Coordinates;
}

export interface LiveTracking {
  orderId: string;
  partnerId: string;
  partnerLocation: Coordinates;
  estimatedArrival: Date;
  currentStep: number;
  totalSteps: number;
  status: 'assigned' | 'picked_up' | 'on_the_way' | 'arrived' | 'delivered';
  lastUpdate: Date;
}

export interface MapMarker {
  id: string;
  position: Coordinates;
  type: 'restaurant' | 'customer' | 'partner' | 'current';
  title: string;
  info?: any;
}