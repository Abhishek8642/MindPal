import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const getGeminiResponse = async (input: string): Promise<string> => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input }] }]
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ transcript: string; ai_response: string }[]>([]);

  const processChatInput = async (input: string) => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const aiResponse = await getGeminiResponse(input);
      setChatHistory([{ transcript: input, ai_response: aiResponse }, ...chatHistory]);
      toast.success('AI response generated!');
    } catch (error) {
      console.error('Error processing chat input:', error);
      toast.error('Failed to process your request');
    } finally {
      setIsProcessing(false);
      setTextInput('');
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Empathetic Chatbot</h1>
        <p className="text-gray-600">Type anything you want to share. The AI will listen and respond.</p>
      </div>
      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-100"
      >
        <form onSubmit={handleTextSubmit} className="flex items-center justify-center space-x-2 mb-4">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full max-w-md px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Type your message..."
            disabled={isProcessing}
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
            disabled={isProcessing || !textInput.trim()}
            title="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        {/* In-memory chat history */}
        <div className="max-h-80 overflow-y-auto mt-6 space-y-4">
          {chatHistory.length === 0 && (
            <div className="text-center text-gray-400">No conversation yet. Type a message to start!</div>
          )}
          {chatHistory.map((session, idx) => (
            <div key={idx} className="flex flex-col items-start space-y-2">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded-xl font-medium">You: {session.transcript}</span>
              </div>
              <div className="flex items-center space-x-2 ml-8">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-xl font-medium">AI: {session.ai_response}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}