import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Heart, 
  Mic, 
  Brain,
  TrendingUp,
  Target,
  Award,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { scheduleMoodReminder, scheduleDailySummary } = useNotifications();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    todayMood: null as number | null,
    voiceSessions: 0,
  });

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get task stats
      const { data: taskData } = await supabase
        .from('tasks')
        .select('completed')
        .eq('user_id', user.id);

      // Get today's mood
      const today = new Date().toISOString().split('T')[0];
      const { data: moodData } = await supabase
        .from('mood_entries')
        .select('mood')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get voice sessions count
      const { data: voiceData } = await supabase
        .from('voice_sessions')
        .select('id')
        .eq('user_id', user.id);

      setStats({
        totalTasks: taskData?.length || 0,
        completedTasks: taskData?.filter(task => task.completed).length || 0,
        todayMood: moodData?.[0]?.mood || null,
        voiceSessions: voiceData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats]);

  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'voice':
          navigate('/voice');
          break;
        case 'mood':
          navigate('/mood');
          break;
        case 'task':
          navigate('/tasks');
          break;
        case 'schedule-mood-reminder':
          await scheduleMoodReminder();
          toast.success('Mood reminder scheduled for tomorrow!');
          break;
        case 'schedule-daily-summary':
          await scheduleDailySummary();
          toast.success('Daily summary scheduled for tonight!');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling quick action:', error);
      toast.error('Failed to perform action');
    }
  };

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  const statCards = [
    {
      title: 'Tasks Completed',
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      subtitle: `${Math.round(completionRate)}% completion rate`,
      icon: CheckSquare,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: "Today's Mood",
      value: stats.todayMood ? `${stats.todayMood}/10` : 'Not logged',
      subtitle: stats.todayMood ? 'Feeling great!' : 'Log your mood',
      icon: Heart,
      color: 'from-pink-400 to-rose-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
    },
    {
      title: 'Voice Sessions',
      value: stats.voiceSessions.toString(),
      subtitle: 'AI conversations',
      icon: Mic,
      color: 'from-purple-400 to-violet-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'Streak',
      value: '7 days',
      subtitle: 'Keep it up!',
      icon: Award,
      color: 'from-orange-400 to-amber-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.email?.split('@')[0]}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${card.bgColor} dark:bg-gray-800 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-r ${card.color} p-3 rounded-xl`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              <div className={`${card.textColor} dark:text-gray-300 space-y-1`}>
                <p className="text-sm font-medium opacity-80">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs opacity-70">{card.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-3">
          <Target className="h-6 w-6 text-purple-600" />
          <span>Quick Actions</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('voice')}
            className="bg-gradient-to-r from-purple-500 to-violet-600 text-white p-6 rounded-xl hover:shadow-lg transition-all duration-200 text-left"
          >
            <Mic className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Voice Input</h3>
            <p className="text-sm opacity-90">Talk to your AI companion</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('mood')}
            className="bg-gradient-to-r from-pink-500 to-rose-600 text-white p-6 rounded-xl hover:shadow-lg transition-all duration-200 text-left"
          >
            <Heart className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Mood Check</h3>
            <p className="text-sm opacity-90">Log your emotions</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('task')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl hover:shadow-lg transition-all duration-200 text-left"
          >
            <CheckSquare className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Add Task</h3>
            <p className="text-sm opacity-90">Create a new reminder</p>
          </motion.button>
        </div>

        {/* Notification Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('schedule-mood-reminder')}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-200 text-left flex items-center space-x-3"
          >
            <Plus className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Schedule Mood Reminder</h3>
              <p className="text-sm opacity-90">Get reminded to check your mood</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleQuickAction('schedule-daily-summary')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-200 text-left flex items-center space-x-3"
          >
            <Plus className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Schedule Daily Summary</h3>
              <p className="text-sm opacity-90">Get your end-of-day report</p>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Built on Bolt Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex justify-center"
      >
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <Brain className="h-4 w-4" />
          <span>Built on Bolt</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </motion.div>
    </div>
  );
}