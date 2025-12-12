
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginWithDemo: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isDemo) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }
    }).catch(err => {
      console.error("Session check failed:", err);
      // If session check fails (e.g. network error), stop loading so user can see login screen (and potentially error/demo options)
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isDemo) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  const fetchProfile = async (userId: string) => {
    if (!userId) {
        setLoading(false);
        return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = (role: string) => {
    setIsDemo(true);
    const mockId = `demo-${role}-id`;
    const mockEmail = `demo.${role}@signaturesecurity.com`;
    const mockName = `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    
    const mockUser: User = {
      id: mockId,
      app_metadata: {},
      user_metadata: { full_name: mockName },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: mockEmail,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString()
    };

    const mockSession: Session = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser
    };

    setSession(mockSession);
    setUser(mockUser);
    setProfile({
      id: mockId,
      email: mockEmail,
      full_name: mockName,
      role: role,
      status: 'active'
    });
    setLoading(false);
  };

  const signOut = async () => {
    if (isDemo) {
      setIsDemo(false);
      setSession(null);
      setUser(null);
      setProfile(null);
    } else {
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        session, 
        user, 
        profile, 
        loading, 
        signOut, 
        loginWithDemo,
        refreshProfile: async () => {
            if (user?.id && !isDemo) await fetchProfile(user.id);
        }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
