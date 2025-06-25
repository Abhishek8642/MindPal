import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'task_reminder' | 'mood_reminder' | 'daily_summary';
  title: string;
  message: string;
  scheduled_for: string;
  sent: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const scheduleNotification = async (
    type: 'task_reminder' | 'mood_reminder' | 'daily_summary',
    title: string,
    message: string,
    scheduledFor: Date
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          type,
          title,
          message,
          scheduled_for: scheduledFor.toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      setNotifications(prev => [...prev, data]);
      
      // Schedule browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const timeUntilNotification = scheduledFor.getTime() - Date.now();
        if (timeUntilNotification > 0) {
          setTimeout(() => {
            new Notification(title, {
              body: message,
              icon: '/vite.svg',
            });
          }, timeUntilNotification);
        }
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast.error('Failed to schedule notification');
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const scheduleTaskReminder = async (taskTitle: string, dueDate: Date) => {
    const reminderTime = new Date(dueDate.getTime() - 30 * 60 * 1000); // 30 minutes before
    await scheduleNotification(
      'task_reminder',
      'Task Reminder',
      `Don't forget: ${taskTitle}`,
      reminderTime
    );
  };

  const scheduleMoodReminder = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
    
    await scheduleNotification(
      'mood_reminder',
      'Mood Check-in',
      'How are you feeling today? Take a moment to log your mood.',
      tomorrow
    );
  };

  const scheduleDailySummary = async () => {
    const today = new Date();
    today.setHours(20, 0, 0, 0); // 8 PM today
    
    await scheduleNotification(
      'daily_summary',
      'Daily Summary',
      'Review your day and see how you did with your tasks and mood.',
      today
    );
  };

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      requestNotificationPermission();
    }
  }, [user, loadNotifications]);

  return {
    notifications,
    scheduleNotification,
    scheduleTaskReminder,
    scheduleMoodReminder,
    scheduleDailySummary,
    requestNotificationPermission,
  };
}