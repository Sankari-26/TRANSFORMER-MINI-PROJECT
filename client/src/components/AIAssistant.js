import React, { useState } from 'react';

const AIAssistant = ({ transformerId }) => {
  const [messages, setMessages] = useState([
    { 
      sender: 'ai', 
      text: `Hello! I am your AI SCADA assistant. I have access to the live database for Transformer #${transformerId}. How can I help you analyze the system today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    // 1. Add user message to screen
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Send to your new Node.js backend route
      const response = await fetch(`http://localhost:5000/api/transformer/${transformerId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await response.json();
      
      // 3. Add AI response to screen
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: data.response || "I'm sorry, I couldn't process that request." 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { sender: 'ai', text: 'Connection error. Is the backend server running?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Prompt Buttons to make testing easy
  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '500px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
      
      {/* Chat History Area */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '15px'
          }}>
            <div style={{ 
              maxWidth: '75%', 
              padding: '12px 16px', 
              borderRadius: '8px',
              backgroundColor: msg.sender === 'user' ? '#0d6efd' : '#e9ecef',
              color: msg.sender === 'user' ? '#fff' : '#333',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              whiteSpace: 'pre-wrap' // Keeps the formatting from the AI
            }}>
              <strong>{msg.sender === 'user' ? 'You' : 'AI Assistant'}</strong><br/>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ textAlign: 'left', color: '#6c757d', fontStyle: 'italic' }}>
            AI is analyzing data...
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: '10px', display: 'flex', gap: '10px', backgroundColor: '#fff', borderTop: '1px solid #ddd' }}>
        <button onClick={() => handleQuickPrompt("Summarize the health of this transformer.")} style={quickBtnStyle}>Summary</button>
        <button onClick={() => handleQuickPrompt("Are there any critical temperature alerts recently?")} style={quickBtnStyle}>Check Temp</button>
        <button onClick={() => handleQuickPrompt("Is the oil level safe right now?")} style={quickBtnStyle}>Check Oil</button>
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: '15px', backgroundColor: '#fff', borderTop: '1px solid #eee', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Ask about voltage, load, outages..." 
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '10px' }}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: '#198754', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Send
        </button>
      </form>
    </div>
  );
};

const quickBtnStyle = {
  padding: '6px 12px', fontSize: '12px', backgroundColor: '#e9ecef', border: '1px solid #ccc', borderRadius: '15px', cursor: 'pointer'
};

export default AIAssistant;