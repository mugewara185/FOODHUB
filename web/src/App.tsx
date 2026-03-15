import React from "react";
import {AuthProvider} from './contexts/AuthContext';
import AppRoutes from "./app/routes";

const App:React.FC =()=>{
  // console.log('%c<App/>','color:orange')
  return (
    <AuthProvider>
      <AppRoutes/>
    </AuthProvider>
  )
}

export default App;