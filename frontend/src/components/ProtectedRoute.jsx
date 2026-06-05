import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token) {
    return <Navigate to="/" />;
  }

  if (allowRoles && !allowRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />; 
  }

  return children;
};

export default ProtectedRoute;