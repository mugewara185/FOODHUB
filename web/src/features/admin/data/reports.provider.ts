export const fetchAnalyticsData = async () => {
  return new Promise<{
    revenueData: any[];
    categoryData: any[];
    topRestaurants: any[];
    stats: any;
    metrics: any;
  }>((resolve) => {
    setTimeout(() => {
      resolve({
        revenueData: [
          { month: 'Jan', revenue: 850000, orders: 2340, avgOrder: 363 },
          { month: 'Feb', revenue: 920000, orders: 2560, avgOrder: 359 },
          { month: 'Mar', revenue: 1100000, orders: 2890, avgOrder: 381 },
          { month: 'Apr', revenue: 1250000, orders: 3120, avgOrder: 401 },
          { month: 'May', revenue: 1180000, orders: 2980, avgOrder: 396 },
          { month: 'Jun', revenue: 1350000, orders: 3450, avgOrder: 391 },
        ],
        categoryData: [
          { name: 'Indian', value: 35 },
          { name: 'Chinese', value: 25 },
          { name: 'Italian', value: 20 },
          { name: 'Fast Food', value: 15 },
          { name: 'Others', value: 5 },
        ],
        topRestaurants: [
          { name: 'Spice Garden', orders: 1245, revenue: 850000, rating: 4.8 },
          { name: 'Pizza Paradise', orders: 2134, revenue: 1120000, rating: 4.6 },
          { name: 'Burger House', orders: 987, revenue: 510000, rating: 4.7 },
          { name: 'Sushi Master', orders: 876, revenue: 680000, rating: 4.9 },
          { name: 'Taco Fiesta', orders: 654, revenue: 380000, rating: 4.5 },
        ],
        stats: [
          { title: 'Total Revenue', value: '₹4,520,000', change: '+15.3%', trend: 'up' },
          { title: 'Total Orders', value: '12,450', change: '+12.8%', trend: 'up' },
          { title: 'Active Users', value: '25.4K', change: '+8.2%', trend: 'up' },
          { title: 'Avg. Order Value', value: '₹363', change: '+5.2%', trend: 'up' },
        ],
        metrics: [
          { label: 'Customer Acquisition Cost', value: '₹245', change: '-8%' },
          { label: 'Customer Lifetime Value', value: '₹2,850', change: '+15%' },
          { label: 'Repeat Order Rate', value: '68%', change: '+5%' },
          { label: 'Average Delivery Time', value: '32 min', change: '-3 min' },
          { label: 'Restaurant Churn Rate', value: '2.4%', change: '-0.5%' },
          { label: 'Customer Satisfaction', value: '4.7/5', change: '+0.2' },
        ]
      });
    }, 1000);
  });
};
