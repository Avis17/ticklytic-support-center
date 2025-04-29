
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardStats } from "@/types";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy, limit, getCountFromServer } from "firebase/firestore";
import { AreaChart, BarChart, PieChart } from "@/components/ui/charts";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0,
    resolvedTickets: 0,
    slaBreached: 0,
    avgResponseTime: 0,
    ticketsByPriority: {
      low: 0,
      normal: 0,
      high: 0,
      critical: 0,
    },
    ticketsByCategory: {
      "Technical": 0,
      "Billing": 0,
      "Feature Request": 0,
      "General": 0,
    },
    ticketsTrend: [
      { date: "Mon", count: 0 },
      { date: "Tue", count: 0 },
      { date: "Wed", count: 0 },
      { date: "Thu", count: 0 },
      { date: "Fri", count: 0 },
      { date: "Sat", count: 0 },
      { date: "Sun", count: 0 },
    ],
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const ticketsRef = collection(db, "tickets");
        
        // Fetch open tickets count
        const openTicketsQuery = query(ticketsRef, where("status", "in", ["open", "in_progress"]));
        const openTicketsSnapshot = await getCountFromServer(openTicketsQuery);
        const openTicketsCount = openTicketsSnapshot.data().count;
        
        // Fetch resolved tickets count
        const resolvedTicketsQuery = query(ticketsRef, where("status", "==", "resolved"));
        const resolvedTicketsSnapshot = await getCountFromServer(resolvedTicketsQuery);
        const resolvedTicketsCount = resolvedTicketsSnapshot.data().count;
        
        // Fetch SLA breached tickets
        const slaBreachedQuery = query(ticketsRef, where("slaBreached", "==", true));
        const slaBreachedSnapshot = await getCountFromServer(slaBreachedQuery);
        const slaBreachedCount = slaBreachedSnapshot.data().count;
        
        // Calculate average response time
        // This is a simplified approach - in production, you would calculate this based on actual response timestamps
        const allTicketsQuery = query(ticketsRef, limit(100));
        const allTicketsSnapshot = await getDocs(allTicketsQuery);
        let totalResponseTime = 0;
        let ticketsWithResponseTime = 0;
        
        allTicketsSnapshot.forEach(doc => {
          const ticket = doc.data();
          if (ticket.responseTime) {
            totalResponseTime += ticket.responseTime;
            ticketsWithResponseTime++;
          }
        });
        
        const avgResponseTime = ticketsWithResponseTime > 0 
          ? +(totalResponseTime / ticketsWithResponseTime).toFixed(1) 
          : 0;
        
        // Fetch tickets by priority
        const priorityTypes = ["low", "normal", "high", "critical"];
        const ticketsByPriority: Record<string, number> = {
          low: 0,
          normal: 0,
          high: 0,
          critical: 0,
        };
        
        for (const priority of priorityTypes) {
          const priorityQuery = query(ticketsRef, where("priority", "==", priority));
          const prioritySnapshot = await getCountFromServer(priorityQuery);
          ticketsByPriority[priority] = prioritySnapshot.data().count;
        }
        
        // Fetch tickets by category
        const categories = ["Technical", "Billing", "Feature Request", "General"];
        const ticketsByCategory: Record<string, number> = {
          "Technical": 0,
          "Billing": 0,
          "Feature Request": 0,
          "General": 0,
        };
        
        for (const category of categories) {
          const categoryQuery = query(ticketsRef, where("category", "==", category));
          const categorySnapshot = await getCountFromServer(categoryQuery);
          ticketsByCategory[category] = categorySnapshot.data().count;
        }
        
        // Fetch tickets trend for last 7 days
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        let ticketsTrend = [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setHours(0, 0, 0, 0);
          date.setDate(date.getDate() - i);
          
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);
          
          const startTime = Timestamp.fromDate(date);
          const endTime = Timestamp.fromDate(nextDate);
          
          const dayQuery = query(
            ticketsRef, 
            where("createdAt", ">=", startTime), 
            where("createdAt", "<", endTime)
          );
          
          const daySnapshot = await getCountFromServer(dayQuery);
          const dayName = days[date.getDay()];
          
          ticketsTrend.push({
            date: dayName,
            count: daySnapshot.data().count
          });
        }
        
        setStats({
          openTickets: openTicketsCount,
          resolvedTickets: resolvedTicketsCount,
          slaBreached: slaBreachedCount,
          avgResponseTime,
          ticketsByPriority,
          ticketsByCategory,
          ticketsTrend,
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast({
          variant: "destructive",
          title: "Failed to load dashboard data",
          description: "Please try refreshing the page."
        });
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [toast]);

  const chartConfig = {
    ticketTrend: {
      data: stats.ticketsTrend.map((item) => ({ name: item.date, value: item.count })),
      categories: ["value"],
      colors: ["#6A5ACD"],
      valueFormatter: (value: number) => `${value} tickets`,
      showLegend: false,
    },
    ticketsByPriority: {
      data: Object.entries(stats.ticketsByPriority).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      })),
      colors: ["#60A5FA", "#34D399", "#FBBF24", "#EF4444"],
      valueFormatter: (value: number) => `${value} tickets`,
    },
    ticketsByCategory: {
      data: Object.entries(stats.ticketsByCategory).map(([name, value]) => ({
        name,
        value,
      })),
      colors: ["#6A5ACD", "#00BFFF", "#D6BCFA", "#C7D2FE"],
      valueFormatter: (value: number) => `${value} tickets`,
    },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome Back, {currentUser?.displayName || "Agent"}</h1>
          <p className="text-muted-foreground">Here's a summary of your support center activity.</p>
        </div>
        <Button onClick={() => navigate("/tickets/new")}>Create New Ticket</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">{loading ? "..." : stats.openTickets}</div>
              <Badge variant="outline" className="flex items-center">
                <ArrowUp className="mr-1 h-4 w-4 text-emerald-500" />
                8.2%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">vs. last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">{loading ? "..." : stats.resolvedTickets}</div>
              <Badge variant="outline" className="flex items-center">
                <ArrowUp className="mr-1 h-4 w-4 text-emerald-500" />
                12%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">vs. last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SLA Breached
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">{loading ? "..." : stats.slaBreached}</div>
              <Badge variant="outline" className="flex items-center">
                <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                3.1%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">vs. last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">{loading ? "..." : `${stats.avgResponseTime}h`}</div>
              <Badge variant="outline" className="flex items-center">
                <Clock className="mr-1 h-4 w-4 text-amber-500" />
                Same
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">vs. last week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[350px] bg-muted/20">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              ) : (
                <AreaChart
                  height={350}
                  data={chartConfig.ticketTrend.data}
                  index="name"
                  categories={chartConfig.ticketTrend.categories}
                  colors={chartConfig.ticketTrend.colors}
                  valueFormatter={chartConfig.ticketTrend.valueFormatter}
                  showLegend={chartConfig.ticketTrend.showLegend}
                  showXAxis
                  showYAxis
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tickets by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[300px] bg-muted/20">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              ) : (
                <PieChart
                  height={300}
                  data={chartConfig.ticketsByPriority.data}
                  index="name"
                  valueFormatter={chartConfig.ticketsByPriority.valueFormatter}
                  colors={chartConfig.ticketsByPriority.colors}
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tickets by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[300px] bg-muted/20">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              ) : (
                <BarChart
                  height={300}
                  data={chartConfig.ticketsByCategory.data}
                  index="name"
                  categories={["value"]}
                  colors={["#6A5ACD"]}
                  valueFormatter={chartConfig.ticketsByCategory.valueFormatter}
                  showLegend={false}
                  showXAxis
                  showYAxis
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
