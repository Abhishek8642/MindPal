import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageSquare, Send, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEncryption } from '../../hooks/useEncryption';
import { useSettings } from '../../hooks/useSettings';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ChatSession {
  transcript: string;
  ai_response: string;
  created_at: string;
}

const getGeminiResponse = async (input: string, personality: string): Promise<string> => {
  try {
    const personalityPrompts = {
      supportive: "You are a supportive and caring AI companion. Respond with empathy and encouragement.",
      professional: "You are a professional AI assistant. Provide clear, concise, and helpful responses.",
      friendly: "You are a friendly and casual AI companion. Be warm and conversational in your responses.",
      motivational: "You are a motivational AI coach. Inspire and encourage the user to achieve their goals."
    };

    const systemPrompt = personalityPrompts[personality as keyof typeof personalityPrompts] || personalityPrompts.supportive;
    const fullPrompt = `${systemPrompt}\n\nUser: ${input}\n\nAssistant:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }]
        })
      }
    );
    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process your request right now.";
    return aiResponse;
  } catch (err) {
    console.error('Gemini API error:', err);
    return "Sorry, I couldn't process your request right now.";
  }
};

export function VoiceAI() {
  const { user } = useAuth();
  const { storeEncryptedData } = useEncryption();
  const { settings } = useSettings();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

  const loadChatHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('voice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setChatHistory(data || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user, loadChatHistory]);

  const processChatInput = async (input: string) => {
    if (!input.trim() || !user) return;
    
    setIsProcessing(true);
    try {
      const aiResponse = await getGeminiResponse(input, settings.ai_personality);
      
      // Store in database
      const { data, error } = await supabase
        .from('voice_sessions')
        .insert([{
          user_id: user.id,
          transcript: input,
          ai_response: aiResponse,
        }])
        .select()
        .single();

      if (error) throw error;

      // Store encrypted data if voice recordings are enabled
      if (settings.voice_recordings) {
        await storeEncryptedData('voice_transcript', input);
        await storeEncryptedData('ai_response', aiResponse);
      }

      setChatHistory([data, ...chatHistory]);
      toast.success('AI response generated!');
    } catch (error) {
      console.error('Error processing chat input:', error);
      toast.error('Failed to process your request');
    } finally {
      setIsProcessing(false);
      setTextInput('');
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Listening... Speak now!');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTextInput(transcript);
      processChatInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast.error('Speech recognition failed');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      processChatInput(textInput);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Voice AI Companion</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Talk or type to your AI companion. Personality: {settings.ai_personality}
        </p>
      </div>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-purple-100 dark:border-purple-800"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <form onSubmit={handleTextSubmit} className="flex items-center space-x-2 flex-1 max-w-md">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-purple-200 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Type your message..."
              disabled={isProcessing || isListening}
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
              disabled={isProcessing || !textInput.trim() || isListening}
              title="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>

          <button
            onClick={startVoiceRecognition}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={isProcessing}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="max-h-96 overflow-y-auto space-y-4">
          {chatHistory.length === 0 && (
            <div className="text-center text-gray-400 dark:text-gray-500">
              No conversation yet. Type a message or use voice input to start!
            </div>
          )}
          {chatHistory.map((session, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                  <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl max-w-xs sm:max-w-md break-words">
                  <strong>You:</strong> {session.transcript}
                </div>
              </div>
              <div className="flex items-start space-x-3 ml-8">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl max-w-xs sm:max-w-md break-words">
                  <strong>AI:</strong> {session.ai_response}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {new Date(session.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {isProcessing && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center space-x-2 text-purple-600 dark:text-purple-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Privacy Notice */}
      {settings.voice_recordings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
        >
          <p className="text-sm text-blue-800 dark:text-blue-300">
            🔒 Your conversations are encrypted and stored securely. You can disable voice recording storage in Settings.
          </p>
        </motion.div>
      )}
    </div>
  );
}