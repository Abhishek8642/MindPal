import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Plus,
  Trash2,
  Share2,
  FileText,
  Edit3,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useChatSessions } from '../../hooks/useChatSessions';
import toast from 'react-hot-toast';

const getGeminiResponse = async (input: string, personality: string, conversationHistory: string = ''): Promise<string> => {
  try {
    const personalityPrompts = {
      supportive: "You are a supportive and caring AI companion. Respond with empathy and encouragement.",
      professional: "You are a professional AI assistant. Provide clear, concise, and helpful responses.",
      friendly: "You are a friendly and casual AI companion. Be warm and conversational in your responses.",
      motivational: "You are a motivational AI coach. Inspire and encourage the user to achieve their goals."
    };

    const systemPrompt = personalityPrompts[personality as keyof typeof personalityPrompts] || personalityPrompts.supportive;
    const contextPrompt = conversationHistory ? `Previous conversation context:\n${conversationHistory}\n\n` : '';
    const fullPrompt = `${systemPrompt}\n\n${contextPrompt}User: ${input}\n\nAssistant:`;

    // Note: Replace with your actual Gemini API key
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
    
    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }
    
    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help! Could you please rephrase your question?";
    return aiResponse;
  } catch (err) {
    console.error('Gemini API error:', err);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
};

export function VoiceAI() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const {
    sessions,
    currentSession,
    messages,
    setCurrentSession,
    loadMessages,
    createNewSession,
    addMessage,
    deleteSession,
    updateSessionTitle,
    generateMoodReport,
    shareChatSession,
  } = useChatSessions();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [moodReport, setMoodReport] = useState<any>(null);

  const processChatInput = async (input: string) => {
    if (!input.trim() || !user) return;
    
    let sessionToUse = currentSession;
    
    // Create new session if none exists
    if (!sessionToUse) {
      sessionToUse = await createNewSession();
      if (!sessionToUse) return;
    }
    
    setIsProcessing(true);
    
    try {
      // Add user message
      await addMessage(sessionToUse.id, 'user', input);
      
      // Get conversation history for context
      const conversationHistory = messages
        .slice(-10) // Last 10 messages for context
        .map(m => `${m.message_type === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n');
      
      // Get AI response with context
      const aiResponse = await getGeminiResponse(input, settings.ai_personality, conversationHistory);
      
      // Add AI response
      await addMessage(sessionToUse.id, 'ai', aiResponse);
      
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

  const handleSessionSelect = async (session: any) => {
    setCurrentSession(session);
    await loadMessages(session.id);
    setShowSessions(false);
  };

  const handleNewChat = async () => {
    await createNewSession();
    setShowSessions(false);
  };

  const handleGenerateReport = async () => {
    if (!currentSession) return;
    
    const report = await generateMoodReport(currentSession.id);
    if (report) {
      setMoodReport(report);
    }
  };

  const handleTitleUpdate = async (sessionId: string, newTitle: string) => {
    await updateSessionTitle(sessionId, newTitle);
    setEditingTitle(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Voice AI Companion</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {currentSession ? `Chat: ${currentSession.title}` : 'Start a new conversation'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors duration-200 flex items-center space-x-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chats</span>
          </button>
          
          <button
            onClick={handleNewChat}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Sessions Sidebar */}
      <AnimatePresence>
        {showSessions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chat Sessions</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                    currentSession?.id === session.id
                      ? 'bg-purple-100 dark:bg-purple-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex-1" onClick={() => handleSessionSelect(session)}>
                    {editingTitle === session.id ? (
                      <input
                        type="text"
                        defaultValue={session.title}
                        className="w-full bg-transparent border-none focus:outline-none text-gray-900 dark:text-white"
                        onBlur={(e) => handleTitleUpdate(session.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTitleUpdate(session.id, e.currentTarget.value);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{session.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitle(editingTitle === session.id ? null : session.id);
                      }}
                      className="text-gray-400 hover:text-blue-500 transition-colors duration-200"
                      title="Edit title"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shareChatSession(session.id);
                      }}
                      className="text-gray-400 hover:text-green-500 transition-colors duration-200"
                      title="Share chat"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                      title="Delete chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {sessions.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No chat sessions yet. Start your first conversation!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800"
      >
        {/* Input Area */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <form onSubmit={handleTextSubmit} className="flex items-center space-x-2 flex-1 max-w-2xl">
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

          <div className="flex items-center space-x-2">
            <button
              onClick={startVoiceRecognition}
              className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white recording-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={isProcessing}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
            </button>
            
            {currentSession && (
              <button
                onClick={handleGenerateReport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2"
                title="Generate mood report"
              >
                <FileText className="h-5 w-5" />
                <span className="hidden sm:inline">Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="max-h-96 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && !currentSession && (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Start a new conversation or select an existing chat!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start space-x-3 ${message.message_type === 'ai' ? 'ml-8' : ''}`}>
              <div className={`p-2 rounded-lg ${
                message.message_type === 'user' 
                  ? 'bg-purple-100 dark:bg-purple-900/30' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {message.message_type === 'user' ? (
                  <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl max-w-xs sm:max-w-md lg:max-w-lg break-words">
                <strong>{message.message_type === 'user' ? 'You' : 'AI'}:</strong> {message.content}
              </div>
            </div>
          ))}
        </div>

        {isProcessing && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-purple-600 dark:text-purple-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Mood Report Modal */}
      <AnimatePresence>
        {moodReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setMoodReport(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mood Analysis Report</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Overall Mood:</p>
                  <p className={`text-lg font-semibold ${
                    moodReport.overall_mood === 'positive' ? 'text-green-600' :
                    moodReport.overall_mood === 'negative' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {moodReport.overall_mood.charAt(0).toUpperCase() + moodReport.overall_mood.slice(1)}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Stress Level:</p>
                  <p className={`text-lg font-semibold ${
                    moodReport.stress_level === 'low' ? 'text-green-600' :
                    moodReport.stress_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {moodReport.stress_level.charAt(0).toUpperCase() + moodReport.stress_level.slice(1)}
                  </p>
                </div>
                
                {moodReport.emotions.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Detected Emotions:</p>
                    <p className="text-gray-600 dark:text-gray-400">{moodReport.emotions.join(', ')}</p>
                  </div>
                )}
                
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Summary:</p>
                  <p className="text-gray-600 dark:text-gray-400">{moodReport.summary}</p>
                </div>
                
                {moodReport.recommendations.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Recommendations:</p>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      {moodReport.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(moodReport, null, 2));
                    toast.success('Report copied to clipboard!');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Copy Report
                </button>
                <button
                  onClick={() => setMoodReport(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Notice */}
      {settings.voice_recordings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
        >
          <p className="text-sm text-blue-800 dark:text-blue-300">
            🔒 Your conversations are encrypted and stored securely. AI remembers context within each chat session. You can disable voice recording storage in Settings.
          </p>
        </motion.div>
      )}
    </div>
  );
}