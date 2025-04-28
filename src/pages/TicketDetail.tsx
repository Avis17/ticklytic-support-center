
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Ticket, TicketComment } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageSquare, User, Clock, Tag } from "lucide-react";

const TicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<{id: string, name: string}[]>([]);
  
  // Get ticket data and comments
  useEffect(() => {
    const fetchTicketData = async () => {
      if (!ticketId) return;
      
      try {
        setLoading(true);
        const ticketRef = doc(db, "tickets", ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (ticketSnap.exists()) {
          const ticketData = ticketSnap.data();
          setTicket({
            id: ticketSnap.id,
            subject: ticketData.subject,
            description: ticketData.description,
            customerEmail: ticketData.customerEmail,
            customerName: ticketData.customerName,
            priority: ticketData.priority,
            status: ticketData.status,
            category: ticketData.category,
            assignedTo: ticketData.assignedAgentId,
            assignedToName: ticketData.assignedAgentName,
            createdAt: ticketData.createdAt,
            updatedAt: ticketData.updatedAt,
            tags: ticketData.tags || [],
          });
          
          // Fetch comments
          await fetchComments(ticketSnap.id);
        } else {
          toast({
            title: "Ticket not found",
            description: "The requested ticket does not exist.",
            variant: "destructive",
          });
          navigate("/tickets");
        }
      } catch (error) {
        console.error("Error fetching ticket: ", error);
        toast({
          title: "Error",
          description: "Failed to load ticket details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch available agents for assignment
    const fetchAvailableAgents = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "in", ["agent", "admin"]));
        const querySnapshot = await getDocs(q);
        
        const agents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        
        setAvailableAgents(agents);
      } catch (error) {
        console.error("Error fetching agents: ", error);
      }
    };
    
    fetchTicketData();
    fetchAvailableAgents();
  }, [ticketId, navigate, toast]);
  
  const fetchComments = async (ticketId: string) => {
    try {
      setCommentsLoading(true);
      const commentsRef = collection(db, "ticketComments");
      const q = query(
        commentsRef,
        where("ticketId", "==", ticketId),
        orderBy("createdAt", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedComments: TicketComment[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedComments.push({
          id: doc.id,
          ticketId: data.ticketId,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          isCustomer: data.isCustomer || false,
          createdAt: data.createdAt,
          attachments: data.attachments || [],
        });
      });
      
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments: ", error);
      toast({
        title: "Error",
        description: "Failed to load ticket comments.",
        variant: "destructive",
      });
    } finally {
      setCommentsLoading(false);
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    
    try {
      setUpdatingStatus(true);
      const ticketRef = doc(db, "tickets", ticket.id);
      
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      
      setTicket({
        ...ticket,
        status: newStatus,
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
      
      toast({
        title: "Status updated",
        description: `Ticket status changed to ${newStatus.replace('_', ' ')}.`,
      });
      
      // Add system comment for the status change
      await addComment(`Ticket status changed to ${newStatus.replace('_', ' ')}.`, true);
    } catch (error) {
      console.error("Error updating status: ", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const handleAssignAgent = async (agentId: string) => {
    if (!ticket) return;
    
    try {
      setUpdatingStatus(true);
      const ticketRef = doc(db, "tickets", ticket.id);
      
      // Find agent name
      const selectedAgent = availableAgents.find(agent => agent.id === agentId);
      
      await updateDoc(ticketRef, {
        assignedAgentId: agentId,
        assignedAgentName: selectedAgent?.name || "Unknown Agent",
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
        updatedAt: Timestamp.now(),
      });
      
      setTicket({
        ...ticket,
        assignedTo: agentId,
        assignedToName: selectedAgent?.name || "Unknown Agent",
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
      
      toast({
        title: "Ticket assigned",
        description: `Ticket assigned to ${selectedAgent?.name || "Unknown Agent"}.`,
      });
      
      // Add system comment for the assignment
      await addComment(`Ticket assigned to ${selectedAgent?.name || "Unknown Agent"}.`, true);
    } catch (error) {
      console.error("Error assigning agent: ", error);
      toast({
        title: "Error",
        description: "Failed to assign ticket.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    
    try {
      setUpdatingStatus(true);
      const ticketRef = doc(db, "tickets", ticket.id);
      
      await updateDoc(ticketRef, {
        priority: newPriority,
        updatedAt: Timestamp.now(),
      });
      
      setTicket({
        ...ticket,
        priority: newPriority,
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
      
      toast({
        title: "Priority updated",
        description: `Ticket priority changed to ${newPriority}.`,
      });
      
      // Add system comment for the priority change
      await addComment(`Ticket priority changed to ${newPriority}.`, true);
    } catch (error) {
      console.error("Error updating priority: ", error);
      toast({
        title: "Error",
        description: "Failed to update ticket priority.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const addComment = async (content: string, isSystem = false) => {
    if (!ticket || !currentUser) return;
    
    try {
      const commentData = {
        ticketId: ticket.id,
        content,
        authorId: isSystem ? 'system' : currentUser.uid,
        authorName: isSystem ? 'System' : currentUser.displayName || 'Unknown User',
        authorEmail: isSystem ? '' : currentUser.email,
        isCustomer: false,
        createdAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, "ticketComments"), commentData);
      
      const newComment: TicketComment = {
        id: docRef.id,
        ...commentData,
        createdAt: commentData.createdAt.toDate().toISOString(),
        attachments: [],
      };
      
      setComments([...comments, newComment]);
      
      // Also update the ticket's updatedAt field
      await updateDoc(doc(db, "tickets", ticket.id), {
        updatedAt: Timestamp.now(),
      });
      
      if (!isSystem) {
        setNewComment("");
      }
    } catch (error) {
      console.error("Error adding comment: ", error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment(newComment);
  };
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    // Convert Firestore timestamp or ISO string to JS date
    const date = timestamp instanceof Timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
      
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
  
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!ticket) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold">Ticket not found</h2>
        <p className="text-muted-foreground mt-2">The requested ticket does not exist or was deleted.</p>
        <Button onClick={() => navigate("/tickets")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tickets
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/tickets")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">#{ticket.id.substring(0, 6)} - {ticket.subject}</h1>
        </div>
        <Badge variant={getStatusBadgeVariant(ticket.status)} className="text-sm py-1 px-3">
          {ticket.status.replace('_', ' ')}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ticket details panel */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <CardDescription>
                Submitted by {ticket.customerName || ticket.customerEmail} on {formatDate(ticket.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
              
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {ticket.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Comments section */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>
                <MessageSquare className="inline-block mr-2 h-4 w-4" />
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commentsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        {comment.authorId === 'system' ? (
                          <AvatarImage src="/placeholder.svg" alt="System" />
                        ) : (
                          <AvatarImage src="/placeholder.svg" alt={comment.authorName} />
                        )}
                        <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{comment.authorName}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm whitespace-pre-wrap">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No comments yet. Be the first to comment on this ticket.
                </div>
              )}
            </CardContent>
            <Separator />
            <CardFooter className="pt-6">
              <form onSubmit={handleSubmitComment} className="w-full">
                <div className="space-y-4">
                  <Textarea 
                    placeholder="Add a comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-24"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={!newComment.trim()}>
                      Add Comment
                    </Button>
                  </div>
                </div>
              </form>
            </CardFooter>
          </Card>
        </div>
        
        {/* Ticket actions panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Status</div>
                <Select 
                  value={ticket.status} 
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">Priority</div>
                <Select 
                  value={ticket.priority} 
                  onValueChange={handlePriorityChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-1">Assigned To</div>
                <Select 
                  value={ticket.assignedTo || ""} 
                  onValueChange={handleAssignAgent}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {availableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="text-sm font-medium">Category</div>
                <div className="text-sm mt-1">{ticket.category || "Uncategorized"}</div>
              </div>
              
              <Separator />
              
              <div>
                <div className="text-sm font-medium">Customer Information</div>
                <div className="flex items-start mt-2 gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div>{ticket.customerName || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">{ticket.customerEmail}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium">Ticket Timeline</div>
                <div className="flex items-start mt-2 gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Created: {formatDate(ticket.createdAt)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Updated: {formatDate(ticket.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
