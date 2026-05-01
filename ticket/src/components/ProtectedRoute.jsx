import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  
  return children;
}