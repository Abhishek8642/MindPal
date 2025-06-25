import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  voice_speed: 'slow' | 'normal' | 'fast';
  ai_personality: 'supportive' | 'professional' | 'friendly' | 'motivational';
  task_reminders: boolean;
  mood_reminders: boolean;
  daily_summary: boolean;
  email_notifications: boolean;
  data_sharing: boolean;
  analytics: boolean;
  voice_recordings: boolean;
}

const defaultSettings: UserSettings = {
  theme: 'light',
  language: 'en',
  voice_speed: 'normal',
  ai_personality: 'supportive',
  task_reminders: true,
  mood_reminders: true,
  daily_summary: true,
  email_notifications: false,
  data_sharing: false,
  analytics: true,
  voice_recordings: true,
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          theme: data.theme,
          language: data.language,
          voice_speed: data.voice_speed,
          ai_personality: data.ai_personality,
          task_reminders: data.task_reminders,
          mood_reminders: data.mood_reminders,
          daily_summary: data.daily_summary,
          email_notifications: data.email_notifications,
          data_sharing: data.data_sharing,
          analytics: data.analytics,
          voice_recordings: data.voice_recordings,
        });
      } else {
        // Create default settings if they don't exist
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .insert([{ user_id: user.id, ...defaultSettings }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating default settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('user_settings')
        .upsert([{ user_id: user.id, ...updatedSettings }]);

      if (error) throw error;

      setSettings(updatedSettings);
      
      // Apply theme immediately
      if (newSettings.theme) {
        applyTheme(newSettings.theme);
      }
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user, loadSettings]);

  useEffect(() => {
    // Apply theme on settings load
    applyTheme(settings.theme);
  }, [settings.theme]);

  return {
    settings,
    loading,
    updateSettings,
  };
}