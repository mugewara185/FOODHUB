import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Restaurant } from "../../../features/restaurant/type";

const RestaurantCard = ({restaurant}: { restaurant: Restaurant }) => {
  // console.log('restaurant mapped:',restaurant['address'])
  const navigate = useNavigate();
const { id, name, image, address, cuisine, rating, deliveryTime, minOrder, deliveryFee }=restaurant;
  return (
    // <motion.div
    //   whileHover={{ scale: 1.03 }}
    //   whileTap={{ scale: 0.97 }}
    //   initial={{ opacity: 0, y: 20 }}
    //   animate={{ opacity: 1, y: 0 }}
    //   transition={{ duration: 0.1 }}
    //   onClick={() => navigate(`/restaurant/${id}`)}
    //   className="bg-gray-600/10 rounded-xl shadow hover:shadow-xl transition cursor-pointer overflow-hidden"
    // >
    //   <img src={image} alt={name} loading="lazy" className="h-40 w-full object-cover" />
    //   <div className="p-4">
    //     <h3 className="font-bold text-lg">{name}</h3>
    //     <p className="text-sm text-gray-500">{address}</p>
    //     <p className="text-sm">{cuisine?.join(", ")}</p>
    //     <p className="text-yellow-600 font-medium mt-1">⭐ {rating}</p>
    //   </div>
    // </motion.div>

    <motion.div
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
  onClick={() => navigate(`/restaurant/${id}`)}
  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer overflow-hidden"
>
  {/* Image Container */}
  <div className="relative w-full aspect-[16/9] overflow-hidden">
  <img
    src={`${image}?w=400&h=225&fit=crop&q=80`}
    srcSet={`
      ${image}?w=400&h=225&fit=crop&q=80 400w,
      ${image}?w=800&h=450&fit=crop&q=80 800w
    `}
    loading="lazy"
    sizes="(max-width: 768px) 100vw, 400px"
    alt={name}
    className="w-full h-full object-cover"
  />
                                      {/* <img
                                        src={`${image}`}
                                        srcSet={`
                                          ${image},
                                          ${image}
                                        `}
                                        loading="lazy"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        alt={name}
                                        className="w-full h-full object-cover"
                                      /> */}
    {/* Optional overlay */}
    <div className="absolute top-2 left-2 bg-white/90 text-xs px-2 py-1 rounded-md font-medium">
      {deliveryTime}
    </div>
  </div>

  {/* Content */}
  <div className="p-4 space-y-1">
    <div className="flex justify-between items-center">
      <h3 className="font-semibold text-lg truncate">{name}</h3>
      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium">
        ⭐ {rating}
      </span>
    </div>

    <p className="text-sm text-gray-500 truncate">{address}</p>

    <p className="text-sm text-gray-600 line-clamp-1">
      {cuisine?.join(", ")}
    </p>

    <div className="flex justify-between text-xs text-gray-500 mt-2">
      <span>₹{minOrder} min</span>
      <span>₹{deliveryFee} delivery</span>
    </div>
  </div>
</motion.div>
  );
};

export default RestaurantCard;

