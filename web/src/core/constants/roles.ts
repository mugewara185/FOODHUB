import { Role, Permission, UserRole } from '../../data/types/auth';

export const PERMISSIONS: Record<Permission, string> = {
  view_dashboard: 'View Dashboard',
  manage_users: 'Manage Users',
  manage_restaurants: 'Manage Restaurants',
  manage_menu: 'Manage Menu Items',
  manage_orders: 'Manage Orders',
  manage_payments: 'Manage Payments',
  view_reports: 'View Reports',
  manage_delivery: 'Manage Delivery',
  place_order: 'Place Orders',
  view_profile: 'View Profile',
  manage_own_restaurant: 'Manage Own Restaurant',
  manage_own_orders: 'Manage Own Orders',
  track_orders: 'Track Orders',
  cancel_orders: 'Cancel Orders',
};

export const ROLES: Record<UserRole, Role> = {
  admin: {
    id: '1',
    name: 'admin',
    displayName: 'Administrator',
    permissions: [
      'view_dashboard',
      'manage_users',
      'manage_restaurants',
      'manage_menu',
      'manage_orders',
      'manage_payments',
      'view_reports',
      'manage_delivery',
      'view_profile',
    ],
    description: 'Full access to all system features',
  },
  restaurant_owner: {
    id: '2',
    name: 'restaurant_owner',
    displayName: 'Restaurant Owner',
    permissions: [
      'view_dashboard',
      'manage_own_restaurant',
      'manage_menu',
      'manage_own_orders',
      'view_reports',
      'view_profile',
    ],
    description: 'Manage own restaurant and orders',
  },
  user: {
    id: '3',
    name: 'user',
    displayName: 'Customer',
    permissions: [
      'place_order',
      'view_profile',
      'track_orders',
      'cancel_orders',
    ],
    description: 'Place orders and track them',
  },
  delivery_partner: {
    id: '4',
    name: 'delivery_partner',
    displayName: 'Delivery Partner',
    permissions: [
      'view_dashboard',
      'manage_delivery',
      'track_orders',
      'view_profile',
    ],
    description: 'Manage deliveries and track orders',
  },
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  restaurant_owner: 3,
  delivery_partner: 2,
  user: 1,
};

// Helper functions
export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
};

export const hasAllPermissions = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.every(permission =>
    userPermissions.includes(permission)
  );
};

export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLES[role]?.permissions || [];
};

export const canAccess = (
  userRole: UserRole,
  targetRole: UserRole
): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
};