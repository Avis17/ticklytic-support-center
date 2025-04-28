
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Home, 
  Inbox, 
  Users, 
  Settings, 
  PieChart, 
  Tag,
  FileText,
  MessageSquare,
  Plus,
  Menu,
  X,
  Bell
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
      adminOnly: false,
    },
    {
      title: "Tickets",
      icon: Inbox,
      href: "/tickets",
      adminOnly: false,
    },
    {
      title: "Customer Portal",
      icon: MessageSquare,
      href: "/customer-portal",
      adminOnly: false,
    },
    {
      title: "Agents",
      icon: Users,
      href: "/agents",
      adminOnly: true,
    },
    {
      title: "Categories",
      icon: Tag,
      href: "/categories",
      adminOnly: true,
    },
    {
      title: "Reports",
      icon: PieChart,
      href: "/reports",
      adminOnly: false,
    },
    {
      title: "Knowledge Base",
      icon: FileText,
      href: "/knowledge-base",
      adminOnly: false,
    },
    {
      title: "Notifications",
      icon: Bell,
      href: "/notifications",
      adminOnly: false,
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
      adminOnly: true,
    },
  ];

  const filteredNavItems = isAdmin
    ? navItems
    : navItems.filter((item) => !item.adminOnly);

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar toggle button for mobile */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 lg:hidden"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 pt-16 bg-background border-r transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-3 py-4 space-y-6">
          <Button variant="default" className="w-full flex items-center" asChild>
            <Link to="/tickets/new">
              <Plus className="mr-2 h-4 w-4" /> New Ticket
            </Link>
          </Button>

          <div className="space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center py-2 px-3 text-sm rounded-md",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
