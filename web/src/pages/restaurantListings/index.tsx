import React, { version } from 'react'
import Restaurants from './V/Restaurants_V'
import { DevVersionRenderer } from '@/core/dev/renderer/DevVersionRenderer'
// import Restaurants from './V/RestaurantsV2'
// import Restaurants from './V/Restaurants_V'
const versions= import.meta.glob('./V/*.tsx');

const index = () => {
  // return (
  //   <div>
  //       <Restaurants />
  //   </div>
  // )
  console.log({version})
  return(
    <DevVersionRenderer
      pageKey='Restaurants'
      defaultVersion='Restaurants_V'
      imports={versions}
    />
  )
}

export default index