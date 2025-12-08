
export interface Lead {
  id: string;
  name: string;
  address?: string; // Made optional
  location?: string; // Added
  phone: string;
  email?: string; // Added
  website: string;
  category: 'Transporte' | 'Software' | 'Consultoría' | 'Industrial' | 'Otros';
  clase: 'A' | 'B' | 'C';
  status?: string; // Added
  probability?: string; // Added
  value?: number; // Added
  lastContact?: string; // Added
  nextAction?: string; // Added
  notes?: string; // Added
  agent?: string;
  isSelected: boolean;
  isSynced?: boolean;
  notionData?: {
    claseColName: string;
    claseColType: string;
  };
}

export interface User {
  name: string;
  avatarUrl: string;
}

export interface HistoryItem {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  title: string;
  description: string;
  timestamp: string;
  isoDate?: string; // Added for reliable date filtering
  user: User;
  clientId?: string;
  clientName?: string;
  clientWebsite?: string; // Nuevo campo para el enlace
  isSynced?: boolean;
}

export enum NoteType {
  Call = 'call',
  Email = 'email',
  Internal = 'note'
}

// --- QUOTES MODULE TYPES ---

export interface QuoteItem {
  id: string;
  quantity: number;
  description: string;
  unitPrice: number;
  amount: number;
}

export interface Quote {
  id: string;
  folio: string;
  date: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  items: QuoteItem[];
  subtotal: number;
  iva: number;
  retIsr?: number;
  total: number;
  notes: string;
  agent: string;
}
