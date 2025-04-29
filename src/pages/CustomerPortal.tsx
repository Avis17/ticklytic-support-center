
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, FileText } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

interface CustomerStats {
  totalCustomers: number;
  activeTickets: number;
  kbArticles: number;
  newCustomers: number;
  percentIncrease: number;
  ticketsIncrease: number;
}

const CustomerPortal: React.FC = () => {
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeTickets: 0,
    kbArticles: 0,
    newCustomers: 0,
    percentIncrease: 0,
    ticketsIncrease: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomerStats = async () => {
      try {
        setLoading(true);
        
        // Get tickets collection ref
        const ticketsRef = collection(db, "tickets");
        
        // Get customers (unique emails from tickets)
        const ticketsSnapshot = await getDocs(ticketsRef);
        const customerEmails = new Set<string>();
        
        ticketsSnapshot.forEach(doc => {
          const ticket = doc.data();
          if (ticket.customerEmail) {
            customerEmails.add(ticket.customerEmail);
          }
        });
        
        // Count total customers
        const totalCustomers = customerEmails.size;
        
        // Get active tickets count
        const activeTicketsQuery = query(ticketsRef, where("status", "in", ["open", "in_progress"]));
        const activeTicketsSnapshot = await getCountFromServer(activeTicketsQuery);
        const activeTickets = activeTicketsSnapshot.data().count;
        
        // Get knowledge base articles count
        const kbArticlesRef = collection(db, "knowledge_base");
        const kbArticlesSnapshot = await getCountFromServer(kbArticlesRef);
        const kbArticles = kbArticlesSnapshot.data().count;
        
        // Get new customers (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newCustomersQuery = query(
          ticketsRef, 
          where("createdAt", ">=", thirtyDaysAgo)
        );
        
        const newCustomersSnapshot = await getDocs(newCustomersQuery);
        const newCustomerEmails = new Set<string>();
        
        newCustomersSnapshot.forEach(doc => {
          const ticket = doc.data();
          if (ticket.customerEmail) {
            newCustomerEmails.add(ticket.customerEmail);
          }
        });
        
        const newCustomers = newCustomerEmails.size;
        
        // Calculate percentage increase (comparing to previous 30 days)
        // This is a simplification - in a real app you'd compare with actual historical data
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const prevMonthQuery = query(
          ticketsRef, 
          where("createdAt", ">=", sixtyDaysAgo),
          where("createdAt", "<", thirtyDaysAgo)
        );
        
        const prevMonthSnapshot = await getDocs(prevMonthQuery);
        const prevMonthEmails = new Set<string>();
        
        prevMonthSnapshot.forEach(doc => {
          const ticket = doc.data();
          if (ticket.customerEmail) {
            prevMonthEmails.add(ticket.customerEmail);
          }
        });
        
        const prevMonthCustomers = prevMonthEmails.size;
        
        let percentIncrease = 0;
        if (prevMonthCustomers > 0) {
          percentIncrease = Math.round((newCustomers - prevMonthCustomers) / prevMonthCustomers * 100);
        }
        
        // Calculate tickets increase
        const prevMonthTicketsCount = prevMonthSnapshot.size;
        const newTicketsCount = newCustomersSnapshot.size;
        let ticketsIncrease = 0;
        
        if (prevMonthTicketsCount > 0) {
          ticketsIncrease = newTicketsCount - prevMonthTicketsCount;
        }
        
        setStats({
          totalCustomers,
          activeTickets,
          kbArticles,
          newCustomers,
          percentIncrease,
          ticketsIncrease
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching customer stats:", error);
        toast({
          variant: "destructive",
          title: "Failed to load customer data",
          description: "Please try refreshing the page."
        });
        setLoading(false);
      }
    };
    
    fetchCustomerStats();
  }, [toast]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Customer Portal</h1>
        <p className="text-muted-foreground">
          Manage customer tickets and information
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Customer Tickets</TabsTrigger>
          <TabsTrigger value="support">Support Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Customers
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : `+${stats.totalCustomers}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "..." : `+${stats.newCustomers} from last month`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Tickets
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : `+${stats.activeTickets}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "..." : `${stats.ticketsIncrease > 0 ? '+' : ''}${stats.ticketsIncrease} since last week`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  KB Articles
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : `+${stats.kbArticles}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  +43 since last month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Customer Tickets</CardTitle>
              <CardDescription>
                View and manage tickets from customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>Customer ticket management feature coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Support Resources</CardTitle>
              <CardDescription>Helpful resources for customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>Customer support resources feature coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerPortal;
