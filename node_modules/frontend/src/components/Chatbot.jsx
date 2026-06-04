import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './Chatbot.module.css';
import { IoChatbubblesOutline, IoCloseOutline, IoLeafOutline } from 'react-icons/io5';
import { IoSend } from 'react-icons/io5';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am your GLASS plant assistant 🌿 Ask me anything about plants, orders, tracking, or returns!' }
  ]);
  const messagesEndRef = useRef(null);

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
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting. Please try again.' }]);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      <button className={styles.chatButton} onClick={() => setIsOpen(!isOpen)} title="Plant Assistant">
        {isOpen ? <IoCloseOutline size={24} /> : <IoLeafOutline size={24} />}
      </button>

      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className={styles.statusIndicator}></span>
              <h4>Plant Assistant</h4>
            </div>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              <IoCloseOutline size={20} />
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
              placeholder="Ask about plants or orders..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className={styles.sendButton}>
              <IoSend size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
