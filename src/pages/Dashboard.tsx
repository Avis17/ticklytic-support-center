
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardStats } from "@/types";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { AreaChart, BarChart, PieChart } from "@/components/ui/charts";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Clock } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 25,
    resolvedTickets: 102,
    slaBreached: 2,
    avgResponseTime: 2.5,
    ticketsByPriority: {
      low: 8,
      normal: 32,
      high: 15,
      critical: 5,
    },
    ticketsByCategory: {
      "Technical": 23,
      "Billing": 14,
      "Feature Request": 9,
      "General": 14,
    },
    ticketsTrend: [
      { date: "Mon", count: 12 },
      { date: "Tue", count: 18 },
      { date: "Wed", count: 15 },
      { date: "Thu", count: 25 },
      { date: "Fri", count: 20 },
      { date: "Sat", count: 10 },
      { date: "Sun", count: 5 },
    ],
  });

  useEffect(() => {
    // This is a placeholder for actual data fetching
    // In a production app, you would fetch real data from Firestore here
    // Example:
    // const fetchDashboardStats = async () => {
    //   const ticketsRef = collection(db, "tickets");
    //   const openTicketsQuery = query(ticketsRef, where("status", "in", ["open", "in_progress"]));
    //   const openTicketsSnapshot = await getDocs(openTicketsQuery);
    //   const openTicketsCount = openTicketsSnapshot.docs.length;
    //   // ... fetch other stats
    //   setStats({...});
    // };
    // fetchDashboardStats();

    // For now, we're using the mock data initialized above
  }, []);

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
              <div className="text-3xl font-bold">{stats.openTickets}</div>
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
              <div className="text-3xl font-bold">{stats.resolvedTickets}</div>
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
              <div className="text-3xl font-bold">{stats.slaBreached}</div>
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
              <div className="text-3xl font-bold">{stats.avgResponseTime}h</div>
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
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tickets by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart
                height={300}
                data={chartConfig.ticketsByPriority.data}
                index="name"
                valueFormatter={chartConfig.ticketsByPriority.valueFormatter}
                colors={chartConfig.ticketsByPriority.colors}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tickets by Category</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
