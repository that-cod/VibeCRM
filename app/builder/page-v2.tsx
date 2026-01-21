"use client";

/**
 * @fileoverview Enhanced builder with chat-based iteration - Phase 2
 * 
 * Split-screen with chat for continuous refinement
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PreviewFrame } from "@/components/preview-frame";
import { ChatInterface } from "@/components/chat-interface";
import { Loader2, Sparkles, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { createConversationManager } from "@/lib/chat/conversation-manager";
import type { ConversationManager } from "@/lib/chat/conversation-manager";
import type { CRMSchema } from "@/types/schema";

export default function BuilderPageV2() {
  const [prompt, setPrompt] = useState("");
  const [schema, setSchema] = useState<CRMSchema | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Conversation manager
  const conversationManagerRef = useRef<ConversationManager | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Initialize conversation manager
  useEffect(() => {
    const manager = createConversationManager();
    conversationManagerRef.current = manager;

    // Subscribe to state changes
    const unsubscribe = manager.subscribe((state) => {
      setMessages(state.messages);
      setIsProcessing(state.isProcessing);
      setCanUndo(manager.canUndo());
      setCanRedo(manager.canRedo());

      // Update schema when it changes
      if (state.currentSchema && state.currentSchema !== schema) {
        setSchema(state.currentSchema);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          project_id: "preview-project",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate schema");
      }

      const data = await response.json();
      
      setSchema(data.schema_json);
      
      // Initialize conversation manager with schema
      if (conversationManagerRef.current) {
        conversationManagerRef.current.initialize(data.schema_json);
        setShowChat(true);
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate CRM");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!conversationManagerRef.current) return;
    await conversationManagerRef.current.addUserMessage(message);
  };

  const handleUndo = () => {
    conversationManagerRef.current?.undo();
  };

  const handleRedo = () => {
    conversationManagerRef.current?.redo();
  };

  const handleClearChat = () => {
    conversationManagerRef.current?.clear();
  };

  const handleProvision = async () => {
    if (!schema) return;
    sessionStorage.setItem("pendingSchema", JSON.stringify(schema));
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Prompt & Chat */}
      <div className="w-1/2 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            VibeCRM Builder
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Describe your CRM and refine it through conversation
          </p>
        </div>

        {/* Content Area */}
        {!schema ? (
          // Initial Prompt Screen
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Describe Your CRM
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a CRM for real estate agents with properties, agents, and showings..."
                className="min-h-[150px] text-base resize-none"
                disabled={isGenerating}
              />
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate CRM
                  </>
                )}
              </Button>
            </div>

            {!isGenerating && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  Try these examples:
                </p>
                <div className="space-y-2">
                  {[
                    "Create a CRM for real estate agents with properties, agents, and showings",
                    "Build a sales CRM with leads, deals, contacts, and companies",
                    "Make a project management CRM with projects, tasks, and team members",
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example)}
                      className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Chat Interface
          <div className="flex-1 flex flex-col">
            {/* Schema Summary */}
            <div className="border-b p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-900">Current Schema</h3>
                <Button
                  onClick={handleProvision}
                  size="sm"
                  variant="default"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Provision
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-blue-700">
                <span>{schema.tables.length} tables</span>
                <span>•</span>
                <span>{schema.relationships?.length || 0} relationships</span>
                <span>•</span>
                <span>v{schema.version}</span>
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                messages={messages}
                isProcessing={isProcessing}
                canUndo={canUndo}
                canRedo={canRedo}
                onSendMessage={handleSendMessage}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClearChat}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Live Preview */}
      <div className="w-1/2 bg-gray-100">
        <PreviewFrame
          schema={schema}
          viewMode="desktop"
          theme="light"
          onNavigate={(path) => {
            console.log("Navigated to:", path);
          }}
          onError={(error) => {
            console.error("Preview error:", error);
          }}
        />
      </div>
    </div>
  );
}
