
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export type TicketPriority = 'low' | 'normal' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  customerEmail: string;
  customerName?: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  isCustomer: boolean;
  createdAt: string;
  attachments?: string[];
}

export interface TicketFilter {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: string[];
  assignedTo?: string;
  searchQuery?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DashboardStats {
  openTickets: number;
  resolvedTickets: number;
  slaBreached: number;
  avgResponseTime: number;
  ticketsByPriority: Record<TicketPriority, number>;
  ticketsByCategory: Record<string, number>;
  ticketsTrend: {
    date: string;
    count: number;
  }[];
}
