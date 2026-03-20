import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Restaurant } from "../../../features/restaurant/type";
import { Box } from "@mui/material";
import { useState } from "react";

const RestaurantCard = ({restaurant}: { restaurant: Restaurant }) => {
  // console.log('restaurant mapped:',restaurant['address'])
  const navigate = useNavigate();
const { id, name, image, address, cuisine, rating, deliveryTime, minOrder, deliveryFee }=restaurant;
const fallBackImgSrc='https://th.bing.com/th/id/OIP.PLyeERi4uNYToVEWGHbhngHaEK?w=321&h=181&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3'
const [fallBackImg, setfallBackImg] = useState<string | null>(null)
  return (
    // </motion.div>
  // <Box flexWrap={'nowrap'}>
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
    {(
      // console.log('rendering image'),
    <img
      // src={`${image}?w=400&h=225&fit=crop&q=80`}
      // src={`${fallBackImg ? fallBackImg : image}?w=400&h=225&fit=crop&q=80`}
      src={`${image}?w=400&h=225&fit=crop&q=80`}
      // onError={() => setfallBackImg(fallBackImgSrc)}
       onError={(e) => {
          (e.target as HTMLImageElement).src = fallBackImgSrc;
        }}
      srcSet={`
        ${image}?w=400&h=225&fit=crop&q=80 400w,
        ${image}?w=800&h=450&fit=crop&q=80 800w
      `}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, 400px"
      alt={name}
      className="w-full h-full object-cover"
    />)}
      {/* fallback overlay (optional UX polish) */}
      {/* {!fallBackImg && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          No Image
        </div>
      )} */}
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
  // </Box>

  );
};

export default RestaurantCard;

