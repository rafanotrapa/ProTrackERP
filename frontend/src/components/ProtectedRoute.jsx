import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // 1. Kalau gak ada token, tendang ke Login
  if (!token) {
    return <Navigate to="/" />;
  }

  // 2. Kalau ada role yang ditentukan (allowRoles), cek user punya role itu gak
  if (allowRoles && !allowRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />; // Role gak cocok? Balikin ke dashboard utama aja
  }

  return children;
};

export default ProtectedRoute;