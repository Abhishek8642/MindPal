import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useEncryption } from './useEncryption';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  session_id: string;
  message_type: 'user' | 'ai';
  content: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

interface MoodAnalysis {
  overall_mood: 'positive' | 'negative' | 'neutral';
  emotions: string[];
  stress_level: 'low' | 'medium' | 'high';
  recommendations: string[];
  summary: string;
}

export function useChatSessions() {
  const { user } = useAuth();
  const { storeEncryptedData } = useEncryption();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMessages = useCallback(async (sessionId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  }, [user]);

  const createNewSession = async (title?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: user.id,
          title: title || `Chat ${new Date().toLocaleDateString()}`,
        }])
        .select()
        .single();

      if (error) throw error;

      const newSession = data;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      
      toast.success('New chat session created!');
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create new session');
      return null;
    }
  };

  const addMessage = async (sessionId: string, messageType: 'user' | 'ai', content: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: sessionId,
          user_id: user.id,
          message_type: messageType,
          content,
        }])
        .select()
        .single();

      if (error) throw error;

      const newMessage = data;
      setMessages(prev => [...prev, newMessage]);

      // Store encrypted data if it's sensitive
      if (messageType === 'user') {
        await storeEncryptedData('chat_message', content);
      }

      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error('Failed to save message');
      return null;
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }

      toast.success('Chat session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const updateSessionTitle = async (sessionId: string, title: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title } : s
      ));

      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title } : null);
      }

      toast.success('Session title updated');
    } catch (error) {
      console.error('Error updating session title:', error);
      toast.error('Failed to update title');
    }
  };

  const generateMoodReport = async (sessionId: string): Promise<MoodAnalysis | null> => {
    if (!user) return null;

    try {
      // Get all messages from the session
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('content, message_type')
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      const userMessages = messagesData?.filter(m => m.message_type === 'user') || [];
      const conversationText = userMessages.map(m => m.content).join(' ');

      // Simple mood analysis (in production, you'd use a proper AI service)
      const analysis = analyzeMoodFromText(conversationText);

      // Store the analysis
      const { error: analyticsError } = await supabase
        .from('mood_analytics')
        .insert([{
          user_id: user.id,
          session_id: sessionId,
          analysis_type: 'mood_report',
          analysis_data: analysis,
        }]);

      if (analyticsError) throw analyticsError;

      toast.success('Mood report generated!');
      return analysis;
    } catch (error) {
      console.error('Error generating mood report:', error);
      toast.error('Failed to generate mood report');
      return null;
    }
  };

  const shareChatSession = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const shareData = {
        title: `MindPal Chat: ${session.title}`,
        text: `Check out my conversation with MindPal AI`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
        toast.success('Chat link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing session:', error);
      toast.error('Failed to share session');
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);

  return {
    sessions,
    currentSession,
    messages,
    loading,
    setCurrentSession,
    loadMessages,
    createNewSession,
    addMessage,
    deleteSession,
    updateSessionTitle,
    generateMoodReport,
    shareChatSession,
  };
}

// Simple mood analysis function (replace with proper AI service in production)
function analyzeMoodFromText(text: string): MoodAnalysis {
  const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'joy', 'excited'];
  const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'depressed', 'worried', 'anxious'];
  const stressWords = ['stress', 'pressure', 'overwhelmed', 'busy', 'tired', 'exhausted', 'deadline'];

  const words = text.toLowerCase().split(/\s+/);
  
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  const stressCount = words.filter(word => stressWords.includes(word)).length;

  let overall_mood: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (positiveCount > negativeCount) overall_mood = 'positive';
  else if (negativeCount > positiveCount) overall_mood = 'negative';

  const emotions: string[] = [];
  if (positiveCount > 0) emotions.push('happiness', 'contentment');
  if (negativeCount > 0) emotions.push('sadness', 'frustration');
  if (stressCount > 0) emotions.push('stress', 'anxiety');

  const stress_level: 'low' | 'medium' | 'high' = 
    stressCount > 3 ? 'high' : stressCount > 1 ? 'medium' : 'low';

  const recommendations: string[] = [];
  if (overall_mood === 'negative') {
    recommendations.push('Consider practicing mindfulness or meditation');
    recommendations.push('Reach out to friends or family for support');
  }
  if (stress_level === 'high') {
    recommendations.push('Take regular breaks throughout your day');
    recommendations.push('Try deep breathing exercises');
  }

  const summary = `Based on your conversation, you seem to be feeling ${overall_mood} with a ${stress_level} stress level. ${emotions.length > 0 ? `Main emotions detected: ${emotions.join(', ')}.` : ''}`;

  return {
    overall_mood,
    emotions,
    stress_level,
    recommendations,
    summary,
  };
}