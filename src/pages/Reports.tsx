
import React, { useState } from "react";
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
import { PieChart, BarChart, LineChart } from "recharts";
import { 
  PieChart as PieChartIcon,
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon,
  Calendar
} from "lucide-react";

const dummyData = {
  ticketsByStatus: [
    { name: "Open", value: 40, fill: "#f97316" },
    { name: "In Progress", value: 30, fill: "#3b82f6" },
    { name: "Resolved", value: 20, fill: "#22c55e" },
    { name: "Closed", value: 10, fill: "#6b7280" },
  ],
  ticketsByPriority: [
    { name: "Low", value: 15, fill: "#22c55e" },
    { name: "Normal", value: 35, fill: "#3b82f6" },
    { name: "High", value: 30, fill: "#f97316" },
    { name: "Critical", value: 20, fill: "#ef4444" },
  ],
  ticketsOverTime: [
    { name: "Jan", created: 65, resolved: 40 },
    { name: "Feb", created: 59, resolved: 45 },
    { name: "Mar", created: 80, resolved: 60 },
    { name: "Apr", created: 81, resolved: 70 },
    { name: "May", created: 56, resolved: 50 },
    { name: "Jun", created: 55, resolved: 52 },
  ],
  responseTime: [
    { name: "Mon", time: 4.5 },
    { name: "Tue", time: 3.8 },
    { name: "Wed", time: 5.2 },
    { name: "Thu", time: 4.2 },
    { name: "Fri", time: 3.5 },
    { name: "Sat", time: 6.2 },
    { name: "Sun", time: 5.8 },
  ],
};

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState("month");

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
                <div className="text-2xl font-bold">2,350</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
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
                <div className="text-2xl font-bold">4.2 hours</div>
                <p className="text-xs text-muted-foreground">
                  -8% from last month
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
                <div className="text-2xl font-bold">87.3%</div>
                <p className="text-xs text-muted-foreground">
                  +4.3% from last month
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
                  <div className="text-center py-10 text-muted-foreground">
                    <PieChartIcon className="h-16 w-16 mx-auto mb-2" />
                    <p>Pie chart visualization will appear here</p>
                  </div>
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
                  <div className="text-center py-10 text-muted-foreground">
                    <BarChartIcon className="h-16 w-16 mx-auto mb-2" />
                    <p>Bar chart visualization will appear here</p>
                  </div>
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
