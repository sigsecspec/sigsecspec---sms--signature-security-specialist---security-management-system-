
import React from 'react';

export type PageView = 
  | 'home' | 'services' | 'about' | 'contact' | 'how-it-works' 
  | 'client-application' | 'guard-application' | 'supervisor-application' 
  | 'operations-application' | 'management-application' | 'owner-application' 
  | 'dispatch-application' | 'secretary-application' | 'lead-guard-dashboard' 
  | 'client-training' | 'guard-training' | 'guard-missions' | 'guard-mission-board' 
  | 'guard-active-mission' | 'guard-active-lead-mission' | 'supervisor-spot-check' 
  | 'management-training' | 'operations-training' | 'supervisor-training' | 'login'
  | 'messages' | 'alerts' | 'notifications' | 'profile' | 'settings';

export type UserRole = 'guard' | 'supervisor' | 'client' | 'operations' | 'management' | 'owner' | 'dispatch' | 'secretary';
export type ProfileStatus = 'active' | 'pending' | 'suspended' | 'terminated' | 'on_leave' | 'applicant';
export type ClientStatus = 'active' | 'pending' | 'suspended' | 'inactive' | 'terminated' | 'on_hold' | 'under_review' | 'applicant' | 'approved' | 'denied' | 'appealed' | 'blocked' | 'incomplete';
export type ClientType = 'Corporate' | 'Retail' | 'Event' | 'Residential' | 'Construction' | 'Industrial' | 'Government' | 'Healthcare';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: ProfileStatus;
  phone_primary?: string;
  phone_secondary?: string;
  avatar_url?: string;
  address_street?: string;
  address_unit?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  bio?: string;
  date_of_birth?: string;
  is_blocked: boolean;
  team_id?: string;
  created_at: string;
  updated_at?: string;
  metadata?: any;
}

export interface ProfileLog {
  id: string;
  action: string;
  performed_by: string;
  role: string;
  note: string;
  created_at: string;
  // Audit Trail Specifics
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Guard extends Profile {
  rank: string;
  level: string; 
  badgeNumber: string;
  payRate?: number;
  hireDate?: string;
  performanceRating: number;
  lastActivity?: string;
  missionCount: number;
  trainingStatus: string; 
  isArmed?: boolean;
  team: string; 
  history: ProfileLog[]; 
}

export interface Client {
  id: string; 
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: ClientStatus;
  type: ClientType;
  team: string;
  contracts: ContractSummary[];
  activeMissions: number;
  satisfactionRating: number;
  budgetUtilization: number;
  lastActivity: string;
  history: ProfileLog[];
  sites?: Site[];
  applicationData?: {
    submittedDate: string;
    businessType: string;
    securityNeeds: string[];
    documents: any[];
  };
  tickets?: any[];
}

export interface Site {
  id: string;
  clientId: string;
  name: string;
  address: string;
  type: string;
  status: string;
  accessPoints?: SiteAccessPoint[];
}

export interface SiteAccessPoint {
  id: string;
  type: 'Gate Code' | 'Keybox' | 'Alarm Code';
  locationDesc: string;
  value: string;
  instructions: string;
}

export interface ContractSummary {
  id: string;
  type: string; 
  startDate: string;
  endDate: string;
  status: string;
  value: number;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  director: string;
  directorId?: string;
  manager: string;
  managerId?: string;
  status: string;
  memberCount: number; 
  clientCount: number;
  activeMissions: number;
  performanceRating: number; 
  members: TeamMember[];
  history: any[];
  stats: {
    completionRate: number;
    utilization: number;
    revenue: number;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'Guard' | 'Supervisor' | 'Client' | 'Operations Staff';
  assignedDate: string;
  status: string;
  performance: number;
  activityLevel: string;
  email?: string;
  rank?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'not_started' | 'in_progress' | 'pending_approval' | 'approved' | 'denied' | 'retake_requested' | 'field_training_requested' | 'blocked' | 'appealed';
  score?: number;
  category?: 'standard' | 'lead' | 'supervisor' | 'operations' | 'management' | 'client';
  attempts: number;
  completedDate?: string;
  progress?: any; 
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface UserCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired' | 'verified' | 'pending_verification' | 'rejected' | 'revoked';
  docUrl?: string;
}

export interface CertificationType {
  id: string;
  cert_id: string;
  name: string;
  category: 'DEFENSIVE_TACTICAL' | 'SAFETY_RESCUE' | 'SECURITY_SPECIALTY' | 'SURVEILLANCE_OPERATIONS' | 'EMERGENCY_MEDICAL' | 'CORE_BSIS' | 'PROPERTY_EVENT' | string;
  is_required: boolean;
  description: string;
  requires_number: boolean;
  requires_expiration: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'guide' | 'video';
  size?: string;
  duration?: string;
  url?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

// --- Communications Types ---

// 1. Direct Messages | 2. Team Chats | 3. Group Chats | 4. Mission Chats
export type ChatType = 'dm' | 'team_chat' | 'group_chat' | 'mission_chat';

// Sub-types for logic handling
// support_channel: Guard <-> Hierarchy (6 channels)
// peer_channel: Guards <-> Guards (Team based)
// company_channel: Staff wide channels (Owners, Dispatch, etc.)
// team_channel: Specific team channel
export type ConversationSubType = 'support_channel' | 'peer_channel' | 'company_channel' | 'team_channel';

export interface Conversation {
  id: string;
  type: ChatType;
  subType?: ConversationSubType; 
  name: string; // Display name
  relatedId?: string; // mission_id or team_id
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  participants: ChatParticipant[];
  status: 'active' | 'archived';
  avatar?: string;
  metadata?: any;
}

export interface ChatParticipant {
  userId: string;
  name: string;
  role: string;
  rank?: string;
  avatar?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  attachments?: {
    url: string;
    name: string;
    type: string;
  }[];
}

export type MissionCode = 'Code 4' | 'Code 1' | 'Code 2' | 'Code 3' | 'Code 5' | 'Code 7' | 'Code 10';
export type SpotCheckStage = 'arrival' | 'dashboard' | 'check1' | 'check2' | 'check3' | 'final_report' | 'completed';
export type TrainingStatus = TrainingModule['status'];
export type GuardStatus = 'active' | 'pending' | 'inactive' | 'suspended' | 'terminated' | 'on_leave' | 'blocked';
export type TeamStatus = 'active' | 'inactive' | 'under_review' | 'pending_setup' | 'suspended';
export type MemberStatus = 'active' | 'inactive' | 'pending' | 'removed' | 'leave';
