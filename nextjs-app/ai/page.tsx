'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Bot, User, Send, Image as ImageIcon, Loader2, X } from 'lucide-react';
import Markdown from 'react-markdown';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: '¡Hola! Soy tu asistente de trading con IA. Puedo ayudarte a analizar gráficos, explicar estrategias de SuperTrend o responder preguntas sobre el mercado. ¿En qué te puedo ayudar hoy?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      imageUrl: imagePreview || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = selectedImage;
    const currentImagePreview = imagePreview;
    
    setInput('');
    setIsLoading(true);
    removeImage();

    try {
      let responseText = '';

      if (currentImage && currentImagePreview) {
        // Handle image + text
        const base64Data = currentImagePreview.split(',')[1];
        if (!base64Data) throw new Error('Failed to process image');

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: currentImage.type,
                },
              },
              { text: currentInput || 'Analiza esta imagen.' },
            ],
          },
        });
        responseText = response.text || 'No pude analizar la imagen.';
      } else {
        // Handle text only
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: currentInput,
        });
        responseText = response.text || 'Lo siento, no pude generar una respuesta.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: responseText,
        },
      ]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen max-w-5xl mx-auto p-4 lg:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00]">
          <Bot className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Asistente IA</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Analiza gráficos y estrategias con Gemini</p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#242424] rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    : 'bg-[#FF6B00] text-white'
                }`}
              >
                {msg.role === 'user' ? <User className="size-5" /> : <Bot className="size-5" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-[#FF6B00] text-white rounded-tr-none'
                    : 'bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#333333] text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded"
                    className="max-w-full h-auto rounded-lg mb-3 border border-white/20"
                  />
                )}
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="size-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shrink-0">
                <Bot className="size-5" />
              </div>
              <div className="bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-[#333333] rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                <Loader2 className="size-5 animate-spin text-[#FF6B00]" />
                <span className="text-sm text-slate-500 dark:text-slate-400">Analizando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50 dark:bg-[#1A1A1A] border-t border-slate-200 dark:border-[#333333]">
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-slate-300 dark:border-slate-600" />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-[#DC3545] text-white rounded-full p-1 hover:bg-[#DC3545] transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative bg-white dark:bg-[#242424] rounded-xl border border-slate-200 dark:border-[#333333] focus-within:border-[#FF6B00] focus-within:ring-1 focus-within:ring-[#FF6B00] transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta sobre trading o sube un gráfico..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none p-3 max-h-32 min-h-[52px] text-sm text-slate-900 dark:text-white"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-[#FF6B00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors"
                  title="Subir gráfico"
                >
                  <ImageIcon className="size-5" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="bg-[#FF6B00] text-white p-3.5 rounded-xl hover:bg-[#FF6B00]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#FF6B00]/20 flex-shrink-0"
            >
              <Send className="size-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
