export const fetchSettings = async () => {
  return new Promise<any>((resolve) => {
    setTimeout(() => {
      resolve({
        platformName: 'FoodHub',
        platformEmail: 'support@foodhub.com',
        platformPhone: '+91 98765 43210',
        platformAddress: '123 Tech Park, Mumbai',
        defaultCommission: 15,
        minCommission: 10,
        maxCommission: 25,
        baseDeliveryFee: 29,
        perKmFee: 5,
        freeDeliveryThreshold: 499,
        maxOrderQuantity: 50,
        orderCancellationTime: 2,
        autoAssignDelivery: true,
        codEnabled: true,
        onlinePaymentEnabled: true,
        walletEnabled: true,
        taxRate: 5,
        serviceFee: 10,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        twoFactorAuth: true,
        maxLoginAttempts: 5,
        sessionTimeout: 30,
      });
    }, 1000);
  });
};
