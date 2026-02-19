import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import type { ChatMessage } from '../types';

const botKnowledge: { keywords: string[]; response: string }[] = [
  {
    keywords: ['ambulance', 'dispatch', 'send', 'assign'],
    response: '🚑 To dispatch an ambulance:\n1. Go to Emergency Calls tab\n2. Select the pending call\n3. The system shows nearest available ambulances sorted by distance\n4. Click "Dispatch" on the best ambulance\n\nThe system prevents assigning ambulances already on duty.',
  },
  {
    keywords: ['hospital', 'bed', 'admit', 'admission'],
    response: '🏥 Hospital coordination:\n1. Once ambulance reaches scene, hospital options appear\n2. Hospitals are sorted by distance & bed availability\n3. Click "Confirm Admission" to coordinate\n4. The system tracks the route to hospital\n\nBed counts update in real-time.',
  },
  {
    keywords: ['route', 'shortest', 'path', 'direction', 'navigation'],
    response: '🗺️ Route optimization:\n• The system calculates the shortest route automatically\n• Real-time traffic congestion zones are shown on the map\n• Red zones = permanently congested (avoid!)\n• Orange zones = heavy traffic areas\n• Yellow zones = peak hour congestion only\n\nRoutes avoid known congestion areas.',
  },
  {
    keywords: ['track', 'location', 'gps', 'position', 'movement'],
    response: '📍 Live tracking:\n• All ambulance positions update every 2 seconds on the map\n• Click any ambulance marker to see details\n• The trail (blue dotted line) shows path taken\n• Use "Track" button to focus the map on a specific ambulance\n• Real-time ETA is calculated continuously.',
  },
  {
    keywords: ['traffic', 'congestion', 'busy', 'jam', 'block'],
    response: '🚦 Traffic & Congestion:\n• Red circles = ALWAYS congested areas (permanent)\n• Orange circles = Heavy traffic zones\n• Yellow circles = Peak hour congestion\n• The system distinguishes permanent vs temporary congestion\n• Routes are optimized to avoid permanent congestion zones.',
  },
  {
    keywords: ['severity', 'priority', 'critical', 'emergency level'],
    response: '⚠️ Severity levels:\n🔴 CRITICAL - Life threatening, immediate response\n🟠 HIGH - Serious condition, urgent\n🟡 MEDIUM - Non-life threatening but needs care\n🟢 LOW - Minor injuries\n\nICU ambulances are auto-suggested for critical cases.',
  },
  {
    keywords: ['status', 'workflow', 'process', 'step'],
    response: '📋 Emergency workflow:\n1. PENDING → Call received, awaiting dispatch\n2. DISPATCHED → Ambulance assigned\n3. EN ROUTE → Ambulance heading to scene\n4. AT SCENE → Ambulance arrived, treating patient\n5. TO HOSPITAL → Transporting to hospital\n6. COMPLETED → Patient admitted, ambulance freed',
  },
  {
    keywords: ['108', 'call', 'phone', 'number'],
    response: '📞 108 Emergency Service:\n• 108 is the universal emergency number in India\n• Calls are received at the central dispatch center\n• Caller location is identified via GPS/cell tower\n• Nearest available ambulance is dispatched\n• Average response time target: under 8 minutes.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'help', 'start'],
    response: '👋 Welcome to the 108 Emergency Response Assistant!\n\nI can help you with:\n• 🚑 Ambulance dispatch procedures\n• 🏥 Hospital coordination\n• 🗺️ Route optimization\n• 📍 Live tracking\n• 🚦 Traffic information\n• ⚠️ Severity classification\n\nWhat would you like to know?',
  },
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: '👋 Hello! I\'m your 108 Emergency Response Assistant. I can help you with dispatch procedures, hospital coordination, route optimization, and more. How can I assist you?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getBotResponse = (userText: string): string => {
    const lower = userText.toLowerCase();
    for (const entry of botKnowledge) {
      if (entry.keywords.some(kw => lower.includes(kw))) {
        return entry.response;
      }
    }
    return '🤔 I\'m not sure about that. I can help with:\n\n• Ambulance dispatch & tracking\n• Hospital coordination\n• Route & traffic info\n• Emergency procedures\n• System navigation\n\nTry asking about any of these topics!';
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: getBotResponse(userMsg.text),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000]">
      {isOpen && (
        <div className="mb-4 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Emergency Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-teal-200">Online 24/7</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.sender === 'user' ? 'bg-teal-600' : 'bg-gray-300'}`}>
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-gray-700" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm whitespace-pre-line ${msg.sender === 'user' ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border'}`}>
                    {msg.text}
                    <p className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-teal-200' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-gray-700" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t bg-white flex gap-2 overflow-x-auto">
            {['Dispatch help', 'Track ambulance', 'Hospital info', 'Traffic'].map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium whitespace-nowrap hover:bg-teal-100 transition-colors border border-teal-200"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about emergency procedures..."
                className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-teal-600 text-white p-2.5 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-105 ${isOpen ? 'bg-gray-700 hover:bg-gray-800' : 'bg-teal-600 hover:bg-teal-700'} text-white`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[9px] font-bold">1</span>
          </div>
        )}
      </button>
    </div>
  );
}
