
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";

const MainLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        {currentUser && (
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        )}
        <main 
          className={`flex-1 transition-all duration-300 ${
            currentUser ? "lg:ml-64" : ""
          }`}
        >
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
