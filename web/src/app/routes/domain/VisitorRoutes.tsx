import { lazy } from 'react';
import { Route } from 'react-router-dom';

const Login = lazy(() => import('@pages/Auth/Login'));
const Signup = lazy(() => import('@pages/Auth/Signup'));

export const VisitorRoutes = <>
    <Route path="login" element={<Login />} />
    <Route path="signup" element={<Signup />} />
</>