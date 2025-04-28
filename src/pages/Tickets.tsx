
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Ticket } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Filter, Search, Plus } from "lucide-react";

const Tickets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        let ticketsQuery = collection(db, "tickets");
        
        // Build filtered query if needed
        let queryConstraints: any[] = [];
        
        if (statusFilter !== "all") {
          queryConstraints.push(where("status", "==", statusFilter));
        }
        
        if (priorityFilter !== "all") {
          queryConstraints.push(where("priority", "==", priorityFilter));
        }
        
        // Apply query constraints and order by creation date
        const q = query(
          ticketsQuery,
          ...queryConstraints,
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedTickets: Ticket[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTickets.push({
            id: doc.id,
            subject: data.subject,
            description: data.description,
            customerEmail: data.customerEmail,
            customerName: data.customerName,
            priority: data.priority,
            status: data.status,
            category: data.category,
            assignedTo: data.assignedAgentId,
            assignedToName: data.assignedAgentName,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            tags: data.tags || [],
          });
        });
        
        // Filter by search query if provided
        const filteredTickets = searchQuery
          ? fetchedTickets.filter(
              (ticket) =>
                ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : fetchedTickets;
        
        setTickets(filteredTickets);
      } catch (error) {
        console.error("Error fetching tickets: ", error);
        toast({
          title: "Error",
          description: "Failed to load tickets. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, [statusFilter, priorityFilter, searchQuery, toast]);

  const handleViewTicket = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'normal':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'outline';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    // Convert Firestore timestamp to JS date
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
      
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground">Manage and track support tickets</p>
        </div>
        <Button onClick={() => navigate('/tickets/new')}>
          <Plus className="mr-2 h-4 w-4" /> Create Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tickets by status, priority, or search for specific terms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 flex-grow">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tickets..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">#{ticket.id.substring(0, 6)}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{ticket.customerName || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">{ticket.customerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(ticket.createdAt)}
                      </TableCell>
                      <TableCell>
                        {ticket.assignedToName || 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTicket(ticket.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>No tickets found. Create your first ticket!</p>
              <Button onClick={() => navigate('/tickets/new')} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Create Ticket
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Tickets;
