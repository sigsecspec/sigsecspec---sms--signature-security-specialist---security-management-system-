
import { supabase } from './supabase';
import { Conversation, Message, ChatType, ChatParticipant, ConversationSubType } from '../types';

// Mock Data for fallback if tables don't exist
let MOCK_CONVERSATIONS: Conversation[] = [];
let MOCK_MESSAGES: Record<string, Message[]> = {};

// Helper to generate a UUID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const chatService = {
  
  // 1. Initialize & Auto-Check
  // Runs on login to ensure all required chats exist for the user
  initializeUserChats: async (user: any) => {
    console.log(`[Auto-System] Checking chat integrity for ${user.id} (${user.role})...`);
    
    // --- 1. Support Channels (Guard Only) ---
    // Guards need 6 specific channels to contact hierarchy
    if (user.role === 'guard') {
        const supportLevels = [
            'Owners', 
            'Management Team', 
            'Dispatch', 
            'Operations Team', 
            'Supervision Team', 
            'Training Team'
        ];

        supportLevels.forEach(level => {
            const channelId = `support-${level.replace(/\s+/g, '-').toLowerCase()}-${user.id}`;
            const exists = MOCK_CONVERSATIONS.find(c => c.id === channelId);
            
            if (!exists) {
                MOCK_CONVERSATIONS.push({
                    id: channelId,
                    type: 'team_chat',
                    subType: 'support_channel',
                    name: level, 
                    unreadCount: 0,
                    participants: [{ userId: user.id, name: user.full_name, role: 'guard' }],
                    status: 'active',
                    lastMessage: `Connected to ${level}.`,
                    lastMessageTime: new Date().toISOString(),
                    metadata: {
                        supportLevel: level,
                        guardId: user.id,
                        guardName: user.full_name,
                        guardBadge: user.badge_number || '0000'
                    }
                });
                
                // Add initial system message
                if (!MOCK_MESSAGES[channelId]) {
                    MOCK_MESSAGES[channelId] = [{
                        id: generateId(),
                        conversationId: channelId,
                        senderId: 'system',
                        senderName: 'System',
                        content: `Support channel created. You are now connected to ${level}.`,
                        timestamp: new Date().toISOString(),
                        type: 'system',
                        isRead: true
                    }];
                }
            }
        });
    }

    // --- 2. Company & Team Channels (Staff) ---
    const isStaff = ['owner', 'management', 'operations', 'dispatch', 'supervisor', 'secretary'].includes(user.role);
    
    if (isStaff) {
        const companyChannels = [
            'Owners', 'Dispatch', 'Management', 'Operations', 
            'Supervision', 'Training', 'Lead', 'All Guards'
        ];
        
        companyChannels.forEach(chan => {
            // Permission check (simplified)
            const canAccess = true; // In real app, check role vs channel
            
            if (canAccess) {
                const chanId = `comp-${chan.toLowerCase().replace(' ', '-')}`;
                if (!MOCK_CONVERSATIONS.find(c => c.id === chanId)) {
                    MOCK_CONVERSATIONS.push({
                        id: chanId,
                        type: 'team_chat',
                        subType: 'company_channel',
                        name: chan,
                        unreadCount: 0,
                        participants: [], // Public channel
                        status: 'active',
                        lastMessage: `Welcome to ${chan} channel.`,
                        lastMessageTime: new Date().toISOString()
                    });
                }
            }
        });
    }

    // --- 3. Peer Chats (Guards - Team Name) ---
    // If user has a team_id, ensure they are in "Guards - [Team Name]"
    // This applies to Guards (Peer) and Staff (Monitoring)
    if (user.team_id) {
        // Mock team name lookup
        const teamName = "Alpha"; 
        const peerId = `peer-guards-${teamName.toLowerCase()}`;
        
        if (!MOCK_CONVERSATIONS.find(c => c.id === peerId)) {
             MOCK_CONVERSATIONS.push({
                id: peerId,
                type: 'team_chat',
                subType: 'peer_channel', // Peer channel for guards
                name: `Guards – ${teamName}`,
                unreadCount: 2,
                participants: [],
                status: 'active',
                lastMessage: 'Who is taking the night shift?',
                lastMessageTime: new Date().toISOString(),
                metadata: {
                    teamId: user.team_id
                }
            });
        }
    }

    // --- 4. Mission Chats ---
    // Auto-generated based on assignments. Mocking one here.
    const missionId = 'mission-204';
    if (!MOCK_CONVERSATIONS.find(c => c.id === missionId)) {
        MOCK_CONVERSATIONS.push({
            id: missionId,
            type: 'mission_chat',
            name: 'Mission #204 – Safeway Overnight Patrol – 11/06/2025',
            unreadCount: 0,
            participants: [],
            status: 'active',
            lastMessage: 'Site secure. Code 4.',
            lastMessageTime: new Date().toISOString()
        });
    }
  },

  // 2. Fetch Conversations
  getConversations: async (userId: string, activeTab: ChatType): Promise<Conversation[]> => {
    // Determine the current user role to format names correctly
    // In a real app, we'd pass the user role or fetch it. 
    // We will assume `initializeUserChats` was called and MOCK_CONVERSATIONS is populated.
    
    // Filter by type based on tab
    let filtered = MOCK_CONVERSATIONS.filter(c => {
        if (activeTab === 'dm') return c.type === 'dm';
        
        if (activeTab === 'team_chat') {
            // Team Chat Tab contains: Support Channels, Company Channels, Peer Channels (if Staff)
            // But spec says "Guards Peer Chat" is separate? 
            // The prompt "2. Team Chats" section lists Support Channels.
            // The prompt "3. Team Chats (Company & Team)" lists Company Channels.
            // We group them all in 'team_chat' type but handle display logic.
            return c.type === 'team_chat';
        }
        
        if (activeTab === 'group_chat') return c.type === 'group_chat'; // Ad-hoc groups
        if (activeTab === 'mission_chat') return c.type === 'mission_chat';
        return false;
    });

    // Formatting Logic for Support Channels
    // If I am STAFF looking at a 'support_channel', I need to see the GUARD'S name.
    // If I am GUARD looking at a 'support_channel', I need to see the TEAM name (e.g. "Owners").
    // We can simulate this by checking if the conversation metadata.guardId matches the requesting userId.
    
    return filtered.map(c => {
        if (c.subType === 'support_channel' && c.metadata && c.metadata.guardId !== userId) {
            // User is NOT the guard who owns this support channel -> User is Staff
            // Format: "#[Badge] [Name] – [Level]"
            return {
                ...c,
                name: `#${c.metadata.guardBadge} ${c.metadata.guardName} – ${c.metadata.supportLevel}`
            };
        }
        return c;
    });
  },

  // 3. Fetch Messages
  getMessages: async (conversationId: string): Promise<Message[]> => {
      try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
            
          if (error || !data || data.length === 0) {
              return MOCK_MESSAGES[conversationId] || [];
          }
          return data.map((m: any) => ({
              id: m.id,
              conversationId: m.conversation_id,
              senderId: m.sender_id,
              senderName: 'User', // In real app, join profiles to get name
              content: m.content,
              timestamp: m.created_at,
              type: m.type,
              isRead: m.is_read,
              attachments: m.attachments
          }));
      } catch (e) {
          return MOCK_MESSAGES[conversationId] || [];
      }
  },

  // 4. Send Message
  sendMessage: async (conversationId: string, sender: any, content: string, attachments: any[] = []): Promise<Message> => {
      const newMessage: Message = {
          id: generateId(),
          conversationId,
          senderId: sender.id,
          senderName: sender.full_name || sender.email,
          content,
          timestamp: new Date().toISOString(),
          type: attachments.length > 0 ? 'file' : 'text',
          isRead: false,
          attachments
      };

      // Optimistic update for mock
      if (!MOCK_MESSAGES[conversationId]) MOCK_MESSAGES[conversationId] = [];
      MOCK_MESSAGES[conversationId].push(newMessage);
      
      // Update convo last message
      const convo = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
      if (convo) {
          convo.lastMessage = content;
          convo.lastMessageTime = newMessage.timestamp;
      }

      // Try DB insert
      try {
          await supabase.from('messages').insert({
              conversation_id: conversationId,
              sender_id: sender.id,
              content: content,
              type: newMessage.type,
              attachments: attachments
          });
      } catch (e) {
          console.warn("DB Insert failed, using mock state only");
      }

      return newMessage;
  },

  // 5. Utility: Get Participants
  getParticipants: async (conversationId: string): Promise<ChatParticipant[]> => {
      // Mock return
      return [
          { userId: '1', name: 'Officer Carter', role: 'Guard', rank: 'OFC' },
          { userId: '2', name: 'Dispatch', role: 'Dispatch', rank: '' }
      ];
  }
};
