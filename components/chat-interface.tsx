"use client";

/**
 * @fileoverview Chat interface component for schema refinement
 * 
 * Phase 2: Chat-Based Iteration
 * Enables conversational refinement of CRM schemas
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Undo2, Redo2, Trash2, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/chat/types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onSendMessage: (message: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

export function ChatInterface({
  messages,
  isProcessing,
  canUndo,
  canRedo,
  onSendMessage,
  onUndo,
  onRedo,
  onClear,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;

    onSendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "Add dark mode",
    "Add a status column",
    "Change table colors",
    "Add search functionality",
    "Make it more modern",
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Refine Your CRM</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo || isProcessing}
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo || isProcessing}
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={messages.length === 0 || isProcessing}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">
              Start refining your CRM by sending a message
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))
        )}

        {isProcessing && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing your request...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length > 0 && !isProcessing && (
        <div className="border-t px-4 py-2 bg-gray-50">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-gray-500 flex-shrink-0">Quick:</span>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(action);
                  inputRef.current?.focus();
                }}
                className="text-xs bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to refine your CRM..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/**
 * Individual chat message bubble
 */
function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        {isUser ? (
          <span className="text-white text-sm font-semibold">You</span>
        ) : (
          <Sparkles className="h-4 w-4 text-gray-600" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-lg p-3 ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Metadata */}
          {message.metadata?.intent && !isUser && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                Intent: {message.metadata.intent.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>
          )}

          {message.metadata?.error && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <span className="text-xs text-red-600">
                Error: {message.metadata.error}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-400 mt-1 ${isUser ? "text-right" : ""}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
