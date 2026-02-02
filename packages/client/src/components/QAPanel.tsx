/**
 * Q&A Panel Component - Interactive question and answer interface
 */

import { useState, useRef, useEffect } from 'react';
import { useWorkshopStore } from '../store/workshop';

interface QAPanelProps {
  onAskQuestion: (question: string) => void;
  onClose: () => void;
}

export function QAPanel({ onAskQuestion, onClose }: QAPanelProps) {
  const [question, setQuestion] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { questionHistory, isAvatarSpeaking, currentAnswer, wsConnected } = useWorkshopStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questionHistory, currentAnswer]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isAvatarSpeaking) {
      onAskQuestion(question.trim());
      setQuestion('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Ask a Question</span>
          {wsConnected && (
            <span className="w-2 h-2 bg-green-500 rounded-full" title="Connected"></span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message */}
        {questionHistory.length === 0 && !currentAnswer && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-semibold mb-2">Have a question?</h3>
            <p className="text-sm text-gray-400">
              Ask anything about the workshop content. I'll answer based on the material we're covering.
            </p>
          </div>
        )}

        {/* Question history */}
        {questionHistory.map((item) => (
          <div key={item.id} className="space-y-3">
            {/* User question */}
            <div className="flex justify-end">
              <div className="bg-primary-600 rounded-lg px-4 py-2 max-w-[80%]">
                <p>{item.question}</p>
              </div>
            </div>

            {/* Avatar answer */}
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-lg px-4 py-2 max-w-[80%]">
                <p className="whitespace-pre-wrap">{item.answer}</p>
                {item.sourcesUsed.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <p className="text-xs text-gray-400">
                      Sources: {item.sourcesUsed.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Current answer being generated */}
        {isAvatarSpeaking && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-4 py-2 max-w-[80%]">
              {currentAnswer ? (
                <p className="whitespace-pre-wrap">{currentAnswer}</p>
              ) : (
                <div className="flex gap-1">
                  <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            'Can you explain that more simply?',
            'What are some examples?',
            'How does this relate to the previous topic?',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setQuestion(suggestion);
                inputRef.current?.focus();
              }}
              className="flex-shrink-0 px-3 py-1 bg-gray-700 rounded-full text-sm hover:bg-gray-600 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 resize-none focus:outline-none focus:border-primary-500"
            rows={2}
            disabled={isAvatarSpeaking}
          />
          <button
            type="submit"
            disabled={!question.trim() || isAvatarSpeaking}
            className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
