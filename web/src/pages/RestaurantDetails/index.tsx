import React from 'react'
// import RestaurantDetails_V from './RestaurantDetailsV1'
import RestaurantDetails_V from './versions/RestaurantDetailsV2'
// import RestaurantDetails_V from './versions/RestaurantDetailsV3'
import { logger } from '../../core/utils/logger'
import RestaurantDetailsV3 from './versions/RestaurantDetailsV3'
import RestaurantDetail from './versions/RestaurantDetail_V4'

const index = () => {
logger.log(`<${RestaurantDetails_V.name}>--------------------------------!`)
  
  return (
    // <div>
      <RestaurantDetail/>
    // </div>
  )
}

export default index