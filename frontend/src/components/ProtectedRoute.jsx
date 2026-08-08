import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  
  if (!token) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }
  
  return children;
}