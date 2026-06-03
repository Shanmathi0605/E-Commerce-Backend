import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './Chatbot.module.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am your AI assistant. Ask me anything about tracking orders, cancels, returns, or seller registrations!' }
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);

    try {
      const res = await axios.post('/api/recommendations/chatbot', { message: userText });
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I am having trouble connecting to support services. Please try again." }]);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      <button className={styles.chatButton} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '💬' : '🤖'}
      </button>

      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div>
              <span className={styles.statusIndicator}></span>
              <h4>Marketplace Assistant</h4>
            </div>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className={styles.messagesList}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.messageBubble} ${
                  msg.sender === 'user' ? styles.userBubble : styles.botBubble
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className={styles.chatInputForm}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Ask a support question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className={styles.sendButton}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
