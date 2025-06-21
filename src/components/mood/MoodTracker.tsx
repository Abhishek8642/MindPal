import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, TrendingUp, Save, Smile } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format, subDays, startOfDay } from 'date-fns';

interface MoodEntry {
  id: string;
  mood: number;
  emoji: string;
  notes: string | null;
  created_at: string;
}

export function MoodTracker() {
  const { user } = useAuth();
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [currentMood, setCurrentMood] = useState(5);
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const moodEmojis = [
    { emoji: '😭', mood: 1, label: 'Terrible' },
    { emoji: '😢', mood: 2, label: 'Sad' },
    { emoji: '😐', mood: 3, label: 'Poor' },
    { emoji: '🙂', mood: 4, label: 'Fair' },
    { emoji: '😊', mood: 5, label: 'Good' },
    { emoji: '😄', mood: 6, label: 'Great' },
    { emoji: '😍', mood: 7, label: 'Wonderful' },
    { emoji: '🤩', mood: 8, label: 'Amazing' },
    { emoji: '🥳', mood: 9, label: 'Fantastic' },
    { emoji: '🌟', mood: 10, label: 'Perfect' },
  ];

  const loadMoodEntries = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setMoodEntries(data || []);
    } catch (error) {
      console.error('Error loading mood entries:', error);
      toast.error('Failed to load mood history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMoodEntries();
    }
  }, [user, loadMoodEntries]);

  const saveMoodEntry = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .insert([
          {
            user_id: user.id,
            mood: currentMood,
            emoji: selectedEmoji,
            notes: notes.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setMoodEntries([data, ...moodEntries]);
      setNotes('');
      toast.success('Mood saved! 🎉');
    } catch (error) {
      console.error('Error saving mood:', error);
      toast.error('Failed to save mood entry');
    }
  };

  const getWeeklyAverage = () => {
    const weekAgo = startOfDay(subDays(new Date(), 7));
    const recentEntries = moodEntries.filter(
      entry => new Date(entry.created_at) >= weekAgo
    );
    
    if (recentEntries.length === 0) return 0;
    
    const sum = recentEntries.reduce((acc, entry) => acc + entry.mood, 0);
    return (sum / recentEntries.length).toFixed(1);
  };

  const handleEmojiSelect = (emojiData: typeof moodEmojis[0]) => {
    setCurrentMood(emojiData.mood);
    setSelectedEmoji(emojiData.emoji);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mood Tracker</h1>
        <p className="text-gray-600">Track your emotional wellness journey</p>
      </div>

      {/* Current Mood Entry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 border border-pink-100"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How are you feeling today?</h2>
          <div className="text-6xl mb-4">{selectedEmoji}</div>
          <p className="text-lg text-purple-700 font-medium">
            {moodEmojis.find(m => m.mood === currentMood)?.label}
          </p>
        </div>

        {/* Emoji Selection */}
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mb-6">
          {moodEmojis.map((emojiData) => (
            <motion.button
              key={emojiData.mood}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEmojiSelect(emojiData)}
              className={`p-3 rounded-xl text-2xl transition-all duration-200 ${
                currentMood === emojiData.mood
                  ? 'bg-white shadow-lg ring-2 ring-purple-400'
                  : 'bg-white/50 hover:bg-white hover:shadow-md'
              }`}
              title={emojiData.label}
            >
              {emojiData.emoji}
            </motion.button>
          ))}
        </div>

        {/* Mood Scale */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Terrible (1)</span>
            <span>Perfect (10)</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={currentMood}
            onChange={(e) => {
              const mood = parseInt(e.target.value);
              setCurrentMood(mood);
              setSelectedEmoji(moodEmojis.find(m => m.mood === mood)?.emoji || '😊');
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mood-slider"
          />
          <div className="text-center mt-2">
            <span className="text-lg font-semibold text-purple-700">{currentMood}/10</span>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's on your mind? (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Share your thoughts, feelings, or what made your day special..."
          />
        </div>

        {/* Save Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={saveMoodEntry}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Save className="h-5 w-5" />
          <span>Save Mood Entry</span>
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-900">Weekly Average</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{getWeeklyAverage()}/10</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">Entries This Month</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{moodEntries.length}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Heart className="h-5 w-5 text-pink-600" />
            <span className="font-medium text-gray-900">Streak</span>
          </div>
          <div className="text-2xl font-bold text-pink-600">7 days</div>
        </motion.div>
      </div>

      {/* Recent Entries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Smile className="h-5 w-5 text-purple-600" />
          <span>Recent Entries</span>
        </h3>

        <div className="space-y-4">
          <AnimatePresence>
            {moodEntries.slice(0, 5).map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="text-2xl">{entry.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{entry.mood}/10</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(entry.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {moodEntries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p>No mood entries yet. Start tracking your emotions!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}