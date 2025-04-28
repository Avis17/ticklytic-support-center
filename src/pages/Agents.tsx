
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, 
  Users, 
  Mail, 
  User, 
  Shield, 
  ShieldOff, 
  BarChart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  ticketsAssigned?: number;
  ticketsResolved?: number;
  createdAt: string;
  availability: string;
}

const Agents = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // New agent form
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("agent");
  const [addingAgent, setAddingAgent] = useState(false);
  
  // Ensure only admins can access this page
  useEffect(() => {
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [userRole, navigate, toast]);
  
  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "in", ["admin", "agent"]));
        const querySnapshot = await getDocs(q);
        
        const fetchedAgents: Agent[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedAgents.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            role: data.role,
            availability: data.availability || "active",
            createdAt: data.createdAt,
            ticketsAssigned: 0, // We'll populate these from ticket data
            ticketsResolved: 0,
          });
        });
        
        // Get ticket counts for each agent
        await Promise.all(
          fetchedAgents.map(async (agent) => {
            const ticketsRef = collection(db, "tickets");
            
            // Count assigned tickets
            const assignedQuery = query(ticketsRef, where("assignedAgentId", "==", agent.id));
            const assignedSnapshot = await getDocs(assignedQuery);
            
            // Count resolved tickets assigned to this agent
            const resolvedQuery = query(
              ticketsRef, 
              where("assignedAgentId", "==", agent.id),
              where("status", "==", "resolved")
            );
            const resolvedSnapshot = await getDocs(resolvedQuery);
            
            agent.ticketsAssigned = assignedSnapshot.size;
            agent.ticketsResolved = resolvedSnapshot.size;
          })
        );
        
        // Sort by role (admins first, then agents)
        fetchedAgents.sort((a, b) => {
          if (a.role === b.role) return a.name.localeCompare(b.name);
          return a.role === "admin" ? -1 : 1;
        });
        
        setAgents(fetchedAgents);
      } catch (error) {
        console.error("Error fetching agents: ", error);
        toast({
          title: "Error",
          description: "Failed to load agents.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgents();
  }, [toast]);
  
  const handleAddAgent = async () => {
    if (!newAgentName || !newAgentEmail || !newAgentPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setAddingAgent(true);
      
      // Create authentication user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newAgentEmail,
        newAgentPassword
      );
      
      const user = userCredential.user;
      
      // Create user document
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        name: newAgentName,
        email: newAgentEmail,
        role: newAgentRole,
        availability: "active",
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: "Agent added",
        description: `${newAgentName} has been added as a ${newAgentRole}.`,
      });
      
      // Reset form fields
      setNewAgentName("");
      setNewAgentEmail("");
      setNewAgentPassword("");
      setNewAgentRole("agent");
      setShowAddDialog(false);
      
      // Refresh agent list
      window.location.reload();
    } catch (error: any) {
      console.error("Error adding agent: ", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add agent.",
        variant: "destructive",
      });
    } finally {
      setAddingAgent(false);
    }
  };
  
  const handleUpdateRole = async (agentId: string, newRole: string) => {
    try {
      const agentRef = doc(db, "users", agentId);
      await updateDoc(agentRef, {
        role: newRole,
      });
      
      // Update local state
      setAgents(agents.map(agent => 
        agent.id === agentId ? { ...agent, role: newRole } : agent
      ));
      
      toast({
        title: "Role updated",
        description: `Agent role has been updated to ${newRole}.`,
      });
    } catch (error) {
      console.error("Error updating role: ", error);
      toast({
        title: "Error",
        description: "Failed to update agent role.",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateAvailability = async (agentId: string, newAvailability: string) => {
    try {
      const agentRef = doc(db, "users", agentId);
      await updateDoc(agentRef, {
        availability: newAvailability,
      });
      
      // Update local state
      setAgents(agents.map(agent => 
        agent.id === agentId ? { ...agent, availability: newAvailability } : agent
      ));
      
      toast({
        title: "Availability updated",
        description: `Agent availability has been updated to ${newAvailability}.`,
      });
    } catch (error) {
      console.error("Error updating availability: ", error);
      toast({
        title: "Error",
        description: "Failed to update agent availability.",
        variant: "destructive",
      });
    }
  };
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    // Convert Firestore timestamp to JS date if needed
    const date = typeof timestamp === 'object' && timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);
      
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  // Redirect non-admin users
  if (userRole !== 'admin') {
    return null;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground">Manage support team members and their permissions</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Agent</DialogTitle>
              <DialogDescription>
                Create a new agent account. They'll receive login credentials via email.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAgentPassword}
                  onChange={(e) => setNewAgentPassword(e.target.value)}
                  placeholder="Enter temporary password"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newAgentRole} onValueChange={setNewAgentRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Support Agent</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddAgent} disabled={addingAgent}>
                {addingAgent ? "Adding..." : "Add Agent"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Team</CardTitle>
          <CardDescription>
            <Users className="mr-2 inline-block h-4 w-4" />
            {agents.length} agents and administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : agents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {agent.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {agent.role === "admin" ? (
                            <Shield className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Badge variant={agent.role === "admin" ? "default" : "outline"}>
                            {agent.role === "admin" ? "Administrator" : "Support Agent"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(agent.createdAt)}</TableCell>
                      <TableCell>
                        <Select 
                          value={agent.availability} 
                          onValueChange={(value) => handleUpdateAvailability(agent.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="vacation">Vacation</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <BarChart className="h-4 w-4 text-muted-foreground" />
                          <span>{agent.ticketsAssigned || 0} assigned</span>
                          <span className="text-muted-foreground">
                            ({agent.ticketsResolved || 0} resolved)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={agent.role} 
                          onValueChange={(value) => handleUpdateRole(agent.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agent">Make Agent</SelectItem>
                            <SelectItem value="admin">Make Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p>No agents found. Add your first team member!</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Agent
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Agents;
