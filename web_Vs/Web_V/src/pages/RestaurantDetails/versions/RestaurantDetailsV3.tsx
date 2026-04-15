import React from "react";
import { Link } from "react-router-dom";
import { RestaurantHeader } from "@/features/restaurant/components/RestaurantHeader";
import { MenuItemCard } from "@/features/restaurant/components/MenuItemCard";
import { useRestaurantDetails } from "@/features/restaurant/hooks/useRestaurantDetails";

const RestaurantDetailsV3: React.FC = () => {
  const {
    restaurant,
    items,
    restaurantReviews,
    cartPreview,
    cartTotal,
    addToCart,
    loading,
  } = useRestaurantDetails();

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 mx-auto max-w-5xl">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-6 mx-auto max-w-4xl text-center">
        <h2 className="text-xl font-semibold">Restaurant not found</h2>
        <p className="text-sm text-gray-500">Please go back to the home page.</p>
        <div className="mt-4">
          <Link to="/" className="text-sm text-red-600 underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
      {/* Main column: header + menu */}
      <div className="lg:col-span-2 space-y-6">
        <RestaurantHeader
          name={restaurant.name}
          image={restaurant.image}
          location={restaurant.location}
          cuisines={restaurant.cuisines}
          rating={restaurant.rating}
        />

        <section>
          <h3 className="text-lg font-semibold mb-4">Menu</h3>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No menu items available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((it) => (
                <MenuItemCard key={it.id} item={it} onAdd={() => addToCart(it)} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">Reviews</h3>
          {restaurantReviews && restaurantReviews.length > 0 ? (
            <div className="space-y-3">
              {restaurantReviews.slice(0, 5).map((r) => (
                <div key={r.id} className="p-3 bg-white rounded shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{r.userId}</div>
                    <div className="text-yellow-500">{r.rating}</div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          )}
        </section>
      </div>

      {/* Right column: cart preview */}
      <aside className="order-first lg:order-last">
        <div className="sticky top-20 p-4 bg-white rounded-lg shadow-sm">
          <h4 className="font-semibold">Cart</h4>
          {cartPreview.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">Your cart is empty.</p>
          ) : (
            <div className="space-y-3 mt-3">
              {cartPreview.map((ci) => (
                <div key={ci.id} className="flex items-center gap-3">
                  <img src={ci.image} alt={ci.name} className="w-12 h-12 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{ci.name}</div>
                    <div className="text-xs text-gray-500">Qty: {ci.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold">₹{ci.price * ci.quantity}</div>
                </div>
              ))}

              <div className="pt-3 border-t flex justify-between items-center">
                <Link to="/cart" className="text-sm bg-red-600 text-white px-3 py-1 rounded">
                  Go to Cart
                </Link>
                <div className="text-sm font-bold">₹{cartTotal}</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default RestaurantDetailsV3;
