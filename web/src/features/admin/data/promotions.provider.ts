export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_delivery';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  applicableTo: 'all' | 'specific' | 'new_users';
  restaurants?: string[];
  status: 'active' | 'expired' | 'scheduled';
  description: string;
}

export const fetchCoupons = async (): Promise<Coupon[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'CPN-001',
          code: 'WELCOME20',
          type: 'percentage',
          value: 20,
          minOrder: 199,
          maxDiscount: 150,
          usageLimit: 10000,
          usedCount: 5432,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          applicableTo: 'new_users',
          status: 'active',
          description: 'Welcome discount for new users',
        },
        {
          id: 'CPN-002',
          code: 'FLAT100',
          type: 'fixed',
          value: 100,
          minOrder: 299,
          usageLimit: 5000,
          usedCount: 1234,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-03-31'),
          applicableTo: 'all',
          status: 'active',
          description: 'Flat ₹100 off on orders above ₹299',
        },
      ]);
    }, 1000);
  });
};
