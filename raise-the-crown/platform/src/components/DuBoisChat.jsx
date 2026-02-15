import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'
import './DuBoisChat.css'

function DuBoisChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'dubois',
      text: 'Welcome, young scholar. I am an AI-generated representation of W.E.B. Du Bois — and the fact that I exist at all should tell you something about where this technology has arrived. I\'m here to discuss the protocols from the workshop, the broader questions of education and purpose, or anything from The Souls of Black Folk. What\'s on your mind?',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputValue.trim(),
    }
    setMessages([...messages, userMessage])
    setInputValue('')

    // TODO: API integration point
    // This is where you would make an API call to your AI service
    // For now, we return a placeholder response

    setTimeout(() => {
      const duboisResponse = {
        id: messages.length + 2,
        sender: 'dubois',
        text: 'That\'s a thoughtful question. The AI integration for this chatbot will be connected soon. In the meantime, revisit the workshop modules — the answers you seek may already be there.',
      }
      setMessages((prev) => [...prev, duboisResponse])
    }, 800)
  }

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button className="dubois-toggle-btn" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
          <span>Office Hours with Brother Du Bois</span>
        </button>
      )}

      {/* Chat Panel */}
      <div className={`dubois-chat-panel ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-content">
            <h3>Office Hours with Brother Du Bois</h3>
            <p className="chat-disclaimer">
              I am an AI-generated persona inspired by W.E.B. Du Bois. This itself is a lesson in what AI can do.
            </p>
          </div>
          <button className="btn-icon" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'dubois' ? 'dubois-message' : 'user-message'}`}
            >
              {message.sender === 'dubois' && (
                <div className="message-sender">Brother Du Bois</div>
              )}
              <div className="message-text">{message.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            placeholder="Ask a question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="btn-icon send-btn" disabled={!inputValue.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* Overlay */}
      {isOpen && <div className="dubois-overlay" onClick={() => setIsOpen(false)} />}
    </>
  )
}

export default DuBoisChat
