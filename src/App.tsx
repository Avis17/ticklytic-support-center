
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Layouts
import MainLayout from "@/components/layout/MainLayout";

// Public Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";

// Authenticated Pages
import Dashboard from "@/pages/Dashboard";
import Tickets from "@/pages/Tickets";
import NewTicket from "@/pages/NewTicket";
import TicketDetail from "@/pages/TicketDetail";
import Agents from "@/pages/Agents";
import Settings from "@/pages/Settings";
import PrivateRoute from "@/components/auth/PrivateRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/tickets/new" element={<NewTicket />} />
                <Route path="/tickets/:ticketId" element={<TicketDetail />} />
                <Route path="/customer-portal" element={<Dashboard />} /> {/* Placeholder until implemented */}
                <Route path="/reports" element={<Dashboard />} /> {/* Placeholder until implemented */}
                <Route path="/knowledge-base" element={<Dashboard />} /> {/* Placeholder until implemented */}
                <Route path="/profile" element={<Dashboard />} /> {/* Placeholder until implemented */}
              </Route>
            </Route>

            {/* Admin Only Routes */}
            <Route element={<PrivateRoute requiredRole="admin" />}>
              <Route element={<MainLayout />}>
                <Route path="/agents" element={<Agents />} />
                <Route path="/categories" element={<Dashboard />} /> {/* Using Settings page for this now */}
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* 404 - Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
