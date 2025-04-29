
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCircle, 
  Trash2, 
  RefreshCw, 
  Filter, 
  Clock, 
  AlertCircle,
  CheckCheck,
  UserCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  Timestamp,
  orderBy
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  timestamp: Date;
  relatedTo?: {
    type: string;
    id: string;
  };
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      const notificationsRef = collection(db, "notifications");
      const notificationsQuery = query(
        notificationsRef,
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      
      const fetchedNotifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedNotifications.push({
          id: doc.id,
          title: data.title,
          message: data.message,
          type: data.type,
          isRead: data.isRead,
          timestamp: data.timestamp.toDate(),
          relatedTo: data.relatedTo,
        });
      });
      
      setNotifications(fetchedNotifications);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        variant: "destructive",
        title: "Failed to load notifications",
        description: "Please try refreshing the page.",
      });
      setLoading(false);
      
      // If we couldn't fetch from Firebase, seed with sample data for demo
      seedSampleNotifications();
    }
  };

  const seedSampleNotifications = () => {
    const SAMPLE_NOTIFICATIONS: Notification[] = [
      {
        id: "1",
        title: "New Ticket Assigned",
        message: "Ticket #TK-2023 has been assigned to you",
        type: "info",
        isRead: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        relatedTo: {
          type: "ticket",
          id: "TK-2023"
        }
      },
      {
        id: "2",
        title: "Urgent Ticket Requires Attention",
        message: "Critical ticket #TK-2019 has been waiting for response for 2 hours",
        type: "warning",
        isRead: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        relatedTo: {
          type: "ticket",
          id: "TK-2019"
        }
      },
      {
        id: "3",
        title: "Ticket Resolved",
        message: "You resolved ticket #TK-2018. Good job!",
        type: "success",
        isRead: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        relatedTo: {
          type: "ticket",
          id: "TK-2018"
        }
      },
      {
        id: "4",
        title: "New Agent Added",
        message: "Sarah Johnson has joined the support team as an agent",
        type: "info",
        isRead: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        relatedTo: {
          type: "agent",
          id: "AG-2023"
        }
      }
    ];
    
    setNotifications(SAMPLE_NOTIFICATIONS);
    setLoading(false);
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      // Update in Firebase
      if (currentUser) {
        const notificationRef = doc(db, "notifications", id);
        await updateDoc(notificationRef, { isRead: true });
      }
      
      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      toast({
        description: "Notification marked as read",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        variant: "destructive",
        title: "Failed to update notification",
        description: "Please try again.",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update in Firebase - only if authenticated
      if (currentUser) {
        const batch = db.batch();
        
        notifications.forEach(notification => {
          if (!notification.isRead) {
            const notificationRef = doc(db, "notifications", notification.id);
            batch.update(notificationRef, { isRead: true });
          }
        });
        
        await batch.commit();
      }
      
      // Update local state
      setNotifications(
        notifications.map((notification) => ({ ...notification, isRead: true }))
      );
      
      toast({
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        variant: "destructive",
        title: "Failed to update notifications",
        description: "Please try again.",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Delete from Firebase if authenticated
      if (currentUser) {
        const notificationRef = doc(db, "notifications", id);
        await deleteDoc(notificationRef);
      }
      
      // Update local state
      setNotifications(
        notifications.filter((notification) => notification.id !== id)
      );
      
      toast({
        description: "Notification deleted",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete notification",
        description: "Please try again.",
      });
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Delete all from Firebase if authenticated
      if (currentUser) {
        const batch = db.batch();
        
        notifications.forEach(notification => {
          const notificationRef = doc(db, "notifications", notification.id);
          batch.delete(notificationRef);
        });
        
        await batch.commit();
      }
      
      // Update local state
      setNotifications([]);
      
      toast({
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      toast({
        variant: "destructive",
        title: "Failed to clear notifications",
        description: "Please try again.",
      });
    }
  };

  const refreshNotifications = () => {
    setLoading(true);
    fetchNotifications();
    
    toast({
      description: "Notifications refreshed",
    });
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'info':
        return <Bell className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with system alerts and ticket updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {filter === 'all' 
                  ? 'All' 
                  : filter === 'unread' 
                    ? 'Unread' 
                    : 'Read'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('unread')}>
                Unread
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('read')}>
                Read
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline"
            size="icon"
            onClick={refreshNotifications}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button 
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 p-4 rounded-md bg-muted/20">
                  <div className="w-6 h-6 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-28">Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow 
                    key={notification.id} 
                    className={!notification.isRead ? "font-medium bg-accent/50" : ""}
                  >
                    <TableCell>
                      {getIconForType(notification.type)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className={`text-sm ${notification.isRead ? 'text-muted-foreground' : ''}`}>
                          {notification.message}
                        </div>
                        {notification.relatedTo && (
                          <Badge variant="outline" className="mt-1">
                            {notification.relatedTo.type}: {notification.relatedTo.id}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(notification.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!notification.isRead && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filter === 'all'
                  ? "No notifications found."
                  : filter === 'unread'
                  ? "No unread notifications."
                  : "No read notifications."}
              </p>
            </div>
          )}
        </CardContent>
        {filteredNotifications.length > 0 && (
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearAllNotifications}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Notifications;
