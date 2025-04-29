
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AreaChart, BarChart, LineChart } from "recharts";
import { 
  PieChart as PieChartIcon,
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon,
  Calendar
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, getCountFromServer } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

interface ReportData {
  ticketsByStatus: { name: string; value: number; fill: string }[];
  ticketsByPriority: { name: string; value: number; fill: string }[];
  ticketsOverTime: { name: string; created: number; resolved: number }[];
  responseTime: { name: string; time: number }[];
  totalTickets: number;
  avgResponseTime: number;
  resolutionRate: number;
}

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [reportData, setReportData] = useState<ReportData>({
    ticketsByStatus: [],
    ticketsByPriority: [],
    ticketsOverTime: [],
    responseTime: [],
    totalTickets: 0,
    avgResponseTime: 0,
    resolutionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Color mapping for consistency
  const statusColors: Record<string, string> = {
    open: "#f97316",
    in_progress: "#3b82f6",
    resolved: "#22c55e",
    closed: "#6b7280"
  };

  const priorityColors: Record<string, string> = {
    low: "#22c55e",
    normal: "#3b82f6",
    high: "#f97316",
    critical: "#ef4444"
  };

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const ticketsRef = collection(db, "tickets");
        
        // Determine date range based on selected timeRange
        const startDate = new Date();
        switch(timeRange) {
          case "week":
            startDate.setDate(startDate.getDate() - 7);
            break;
          case "month":
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case "quarter":
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case "year":
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1); // Default to month
        }
        
        const startTimestamp = Timestamp.fromDate(startDate);
        
        // Get total tickets in the time range
        const timeRangeQuery = query(ticketsRef, where("createdAt", ">=", startTimestamp));
        const timeRangeSnapshot = await getCountFromServer(timeRangeQuery);
        const totalTickets = timeRangeSnapshot.data().count;
        
        // Fetch tickets by status
        const statusTypes = ["open", "in_progress", "resolved", "closed"];
        const ticketsByStatus = [];
        
        for (const status of statusTypes) {
          const statusQuery = query(
            ticketsRef, 
            where("status", "==", status),
            where("createdAt", ">=", startTimestamp)
          );
          
          const statusSnapshot = await getCountFromServer(statusQuery);
          const statusCount = statusSnapshot.data().count;
          
          ticketsByStatus.push({
            name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
            value: statusCount,
            fill: statusColors[status] || "#6b7280"
          });
        }
        
        // Fetch tickets by priority
        const priorityTypes = ["low", "normal", "high", "critical"];
        const ticketsByPriority = [];
        
        for (const priority of priorityTypes) {
          const priorityQuery = query(
            ticketsRef, 
            where("priority", "==", priority),
            where("createdAt", ">=", startTimestamp)
          );
          
          const prioritySnapshot = await getCountFromServer(priorityQuery);
          const priorityCount = prioritySnapshot.data().count;
          
          ticketsByPriority.push({
            name: priority.charAt(0).toUpperCase() + priority.slice(1),
            value: priorityCount,
            fill: priorityColors[priority] || "#6b7280"
          });
        }
        
        // Calculate average response time
        const ticketsWithResponse = await getDocs(query(
          ticketsRef,
          where("createdAt", ">=", startTimestamp),
          where("firstResponseTime", ">", 0)
        ));
        
        let totalResponseTime = 0;
        ticketsWithResponse.forEach(doc => {
          const data = doc.data();
          if (data.firstResponseTime) {
            totalResponseTime += data.firstResponseTime;
          }
        });
        
        const avgResponseTime = ticketsWithResponse.size > 0 
          ? +(totalResponseTime / ticketsWithResponse.size).toFixed(1) 
          : 0;
        
        // Calculate resolution rate
        const resolvedTicketsQuery = query(
          ticketsRef,
          where("createdAt", ">=", startTimestamp),
          where("status", "==", "resolved")
        );
        
        const resolvedTicketsSnapshot = await getCountFromServer(resolvedTicketsQuery);
        const resolvedCount = resolvedTicketsSnapshot.data().count;
        
        const resolutionRate = totalTickets > 0 
          ? +((resolvedCount / totalTickets) * 100).toFixed(1) 
          : 0;
        
        // Generate tickets over time data
        const ticketsOverTime = [];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // For simplicity, we'll generate the last 6 months/weeks/days based on timeRange
        const periodCount = 6;
        let periodUnit: "day" | "week" | "month" = "month";
        
        switch(timeRange) {
          case "week":
            periodUnit = "day";
            break;
          case "month":
            periodUnit = "day";
            break;
          case "quarter":
            periodUnit = "week";
            break;
          case "year":
            periodUnit = "month";
            break;
        }
        
        for (let i = periodCount - 1; i >= 0; i--) {
          const periodStart = new Date();
          const periodEnd = new Date();
          
          switch(periodUnit) {
            case "day":
              periodStart.setDate(periodStart.getDate() - i);
              periodStart.setHours(0, 0, 0, 0);
              
              periodEnd.setDate(periodEnd.getDate() - i + 1);
              periodEnd.setHours(0, 0, 0, 0);
              break;
            case "week":
              periodStart.setDate(periodStart.getDate() - (i * 7));
              periodStart.setHours(0, 0, 0, 0);
              
              periodEnd.setDate(periodEnd.getDate() - (i * 7) + 7);
              periodEnd.setHours(0, 0, 0, 0);
              break;
            case "month":
              periodStart.setMonth(periodStart.getMonth() - i);
              periodStart.setDate(1);
              periodStart.setHours(0, 0, 0, 0);
              
              periodEnd.setMonth(periodEnd.getMonth() - i + 1);
              periodEnd.setDate(1);
              periodEnd.setHours(0, 0, 0, 0);
              break;
          }
          
          const startTime = Timestamp.fromDate(periodStart);
          const endTime = Timestamp.fromDate(periodEnd);
          
          // Created tickets in period
          const createdQuery = query(
            ticketsRef,
            where("createdAt", ">=", startTime),
            where("createdAt", "<", endTime)
          );
          
          const createdSnapshot = await getCountFromServer(createdQuery);
          const createdCount = createdSnapshot.data().count;
          
          // Resolved tickets in period
          const resolvedQuery = query(
            ticketsRef,
            where("resolvedAt", ">=", startTime),
            where("resolvedAt", "<", endTime)
          );
          
          const resolvedSnapshot = await getCountFromServer(resolvedQuery);
          const resolvedCount = resolvedSnapshot.data().count;
          
          let periodName;
          if (periodUnit === "day") {
            periodName = periodStart.getDate().toString();
          } else if (periodUnit === "week") {
            periodName = `W${Math.ceil(periodStart.getDate() / 7)}`;
          } else {
            periodName = months[periodStart.getMonth()];
          }
          
          ticketsOverTime.push({
            name: periodName,
            created: createdCount,
            resolved: resolvedCount
          });
        }
        
        // Generate response time data for days of week
        const responseTime = [];
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        
        // For this demo, we'll generate somewhat random but realistic data
        // In a real app, you would calculate actual average response times by day
        for (let day of days) {
          // This is just placeholder data - in a real app you'd calculate this from actual data
          const time = 3 + Math.random() * 3;
          responseTime.push({
            name: day,
            time: +time.toFixed(1)
          });
        }
        
        setReportData({
          ticketsByStatus,
          ticketsByPriority,
          ticketsOverTime,
          responseTime,
          totalTickets,
          avgResponseTime,
          resolutionRate
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          variant: "destructive",
          title: "Failed to load report data",
          description: "Please try refreshing the page."
        });
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [timeRange, toast]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and performance metrics
          </p>
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="quarter">Last 90 days</SelectItem>
            <SelectItem value="year">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tickets
                </CardTitle>
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : reportData.totalTickets}
                </div>
                <p className="text-xs text-muted-foreground">
                  {timeRange === "week" ? "Last 7 days" : timeRange === "month" ? "Last 30 days" : timeRange === "quarter" ? "Last 90 days" : "Last 12 months"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Response Time
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : `${reportData.avgResponseTime} hours`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on first response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Resolution Rate
                </CardTitle>
                <LineChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : `${reportData.resolutionRate}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tickets resolved vs. created
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>Current ticket distribution</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-full aspect-[4/3] max-h-[300px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full bg-muted/20">
                      <p className="text-muted-foreground">Loading chart data...</p>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <PieChartIcon className="h-16 w-16 mx-auto mb-2" />
                      <p>Pie chart visualization will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets over Time</CardTitle>
                <CardDescription>
                  Created vs. Resolved tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full aspect-[4/3] max-h-[300px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full bg-muted/20">
                      <p className="text-muted-foreground">Loading chart data...</p>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <BarChartIcon className="h-16 w-16 mx-auto mb-2" />
                      <p>Bar chart visualization will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>
                Response times and resolution rates by agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>Agent performance metrics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Analysis</CardTitle>
              <CardDescription>
                Ticket patterns by customer segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <p>Customer analysis dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
