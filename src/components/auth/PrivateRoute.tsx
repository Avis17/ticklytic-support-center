
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PrivateRouteProps {
  requiredRole?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth();

  // If the authentication is still being determined, show nothing
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If a specific role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  // If all checks pass, render the child routes
  return <Outlet />;
};

export default PrivateRoute;
