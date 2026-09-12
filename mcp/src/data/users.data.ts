/**
 * Mock user data for FoodHub Analytics MCP Server.
 *
 * 20 users with realistic profiles, segments, and activity metadata
 * to support user-dimension analytics.
 */

export type UserRole = 'customer' | 'restaurant_owner' | 'delivery_partner' | 'admin';
export type UserSegment = 'new' | 'casual' | 'regular' | 'power';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  segment: UserSegment;
  city: string;
  isActive: boolean;
  isBanned: boolean;
  joinedAt: string;   // ISO date
  lastOrderAt?: string; // ISO date
  totalOrders: number;
  totalSpend: number;  // INR
}

export const MOCK_USERS: MockUser[] = [
  { id: 'user-001', name: 'Aarav Sharma', email: 'aarav@example.com', role: 'customer', segment: 'power', city: 'Mumbai', isActive: true, isBanned: false, joinedAt: '2023-01-05', lastOrderAt: '2024-12-31', totalOrders: 42, totalSpend: 18420 },
  { id: 'user-002', name: 'Priya Patel', email: 'priya@example.com', role: 'customer', segment: 'regular', city: 'Mumbai', isActive: true, isBanned: false, joinedAt: '2023-03-12', lastOrderAt: '2024-12-31', totalOrders: 28, totalSpend: 11200 },
  { id: 'user-003', name: 'Rohan Mehta', email: 'rohan@example.com', role: 'customer', segment: 'casual', city: 'Mumbai', isActive: true, isBanned: false, joinedAt: '2023-06-01', lastOrderAt: '2024-12-19', totalOrders: 14, totalSpend: 5600 },
  { id: 'user-004', name: 'Sanya Kapoor', email: 'sanya@example.com', role: 'customer', segment: 'power', city: 'Bengaluru', isActive: true, isBanned: false, joinedAt: '2023-02-20', lastOrderAt: '2024-12-25', totalOrders: 38, totalSpend: 22800 },
  { id: 'user-005', name: 'Vikram Nair', email: 'vikram@example.com', role: 'customer', segment: 'regular', city: 'Bengaluru', isActive: true, isBanned: false, joinedAt: '2023-04-15', lastOrderAt: '2024-12-27', totalOrders: 22, totalSpend: 9900 },
  { id: 'user-006', name: 'Ananya Singh', email: 'ananya@example.com', role: 'customer', segment: 'casual', city: 'Delhi', isActive: true, isBanned: false, joinedAt: '2023-05-20', lastOrderAt: '2024-12-26', totalOrders: 12, totalSpend: 4800 },
  { id: 'user-007', name: 'Kabir Verma', email: 'kabir@example.com', role: 'customer', segment: 'regular', city: 'Mumbai', isActive: true, isBanned: false, joinedAt: '2023-07-01', lastOrderAt: '2024-12-31', totalOrders: 20, totalSpend: 8600 },
  { id: 'user-008', name: 'Divya Reddy', email: 'divya@example.com', role: 'customer', segment: 'new', city: 'Delhi', isActive: true, isBanned: false, joinedAt: '2024-10-01', lastOrderAt: '2024-11-22', totalOrders: 4, totalSpend: 1200 },
  { id: 'user-009', name: 'Arjun Kumar', email: 'arjun@example.com', role: 'customer', segment: 'regular', city: 'Chennai', isActive: true, isBanned: false, joinedAt: '2023-08-10', lastOrderAt: '2024-12-28', totalOrders: 18, totalSpend: 9200 },
  { id: 'user-010', name: 'Meera Iyer', email: 'meera@example.com', role: 'customer', segment: 'power', city: 'Mumbai', isActive: true, isBanned: false, joinedAt: '2023-01-15', lastOrderAt: '2024-12-31', totalOrders: 35, totalSpend: 15400 },
  { id: 'user-011', name: 'Rahul Gupta', email: 'rahul@example.com', role: 'customer', segment: 'regular', city: 'Mumbai', isActive: true, isBanned: false, joinedAt: '2023-02-28', lastOrderAt: '2024-12-25', totalOrders: 24, totalSpend: 10800 },
  { id: 'user-012', name: 'Pooja Joshi', email: 'pooja@example.com', role: 'customer', segment: 'casual', city: 'Hyderabad', isActive: true, isBanned: false, joinedAt: '2023-09-01', lastOrderAt: '2024-12-04', totalOrders: 9, totalSpend: 3600 },
  { id: 'user-013', name: 'Kiran Das', email: 'kiran@example.com', role: 'customer', segment: 'regular', city: 'Chennai', isActive: true, isBanned: false, joinedAt: '2023-05-05', lastOrderAt: '2024-12-08', totalOrders: 16, totalSpend: 6800 },
  { id: 'user-014', name: 'Nisha Roy', email: 'nisha@example.com', role: 'customer', segment: 'power', city: 'Bengaluru', isActive: true, isBanned: false, joinedAt: '2023-01-20', lastOrderAt: '2024-12-11', totalOrders: 44, totalSpend: 19800 },
  { id: 'user-015', name: 'Suresh Pillai', email: 'suresh@example.com', role: 'customer', segment: 'regular', city: 'Hyderabad', isActive: true, isBanned: false, joinedAt: '2023-06-15', lastOrderAt: '2024-12-26', totalOrders: 19, totalSpend: 8200 },
  { id: 'user-016', name: 'Lakshmi Rao', email: 'lakshmi@example.com', role: 'customer', segment: 'casual', city: 'Delhi', isActive: false, isBanned: false, joinedAt: '2023-07-20', lastOrderAt: '2024-12-14', totalOrders: 11, totalSpend: 4600 },
  { id: 'user-017', name: 'Amit Chandra', email: 'amit@example.com', role: 'customer', segment: 'new', city: 'Pune', isActive: true, isBanned: false, joinedAt: '2024-11-01', lastOrderAt: '2024-12-15', totalOrders: 5, totalSpend: 2200 },
  { id: 'user-018', name: 'Farhan Sheikh', email: 'farhan@example.com', role: 'customer', segment: 'regular', city: 'Chennai', isActive: true, isBanned: false, joinedAt: '2023-04-01', lastOrderAt: '2024-12-29', totalOrders: 21, totalSpend: 9800 },
  { id: 'user-019', name: 'Deepa Nambiar', email: 'deepa@example.com', role: 'customer', segment: 'regular', city: 'Bengaluru', isActive: true, isBanned: false, joinedAt: '2023-03-10', lastOrderAt: '2024-12-31', totalOrders: 17, totalSpend: 7400 },
  { id: 'user-020', name: 'Ravi Teja', email: 'ravi@example.com', role: 'customer', segment: 'casual', city: 'Hyderabad', isActive: true, isBanned: false, joinedAt: '2023-10-15', lastOrderAt: '2024-12-31', totalOrders: 8, totalSpend: 3400 },
];
