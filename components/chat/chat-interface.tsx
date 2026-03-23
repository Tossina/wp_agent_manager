"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  Plus,
  MessageSquare,
  Loader2,
  Sparkles,
  Globe,
  Package,
  ShoppingCart,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./chat-message";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
}

interface Site {
  id: string;
  name: string;
  url: string;
}

interface Props {
  site: Site;
  conversations: Conversation[];
}

const SUGGESTIONS = [
  { icon: Package, text: "Lister tous les plugins installés", category: "plugins" },
  { icon: Globe, text: "Créer une page d'accueil professionnelle", category: "content" },
  { icon: ShoppingCart, text: "Configurer WooCommerce pour la France", category: "woocommerce" },
  { icon: BarChart3, text: "Effectuer un audit de sécurité complet", category: "audit" },
];

export function ChatInterface({ site, conversations: initialConversations }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Charger les messages d'une conversation
  const loadConversation = useCallback(async (convId: string) => {
    setActiveConvId(convId);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (activeConvId) loadConversation(activeConvId);
  }, [activeConvId, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const createNewConversation = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id }),
      });
      const data = await res.json();
      const newConv: Conversation = {
        id: data.conversation.id,
        title: data.conversation.title,
        updatedAt: data.conversation.createdAt,
        preview: "",
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch {
      console.error("Erreur création conversation");
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput("");

    // Créer la conversation si nécessaire
    let convId = activeConvId;
    if (!convId) {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: site.id }),
      });
      const data = await res.json();
      convId = data.conversation.id;
      setActiveConvId(convId);
      setConversations((prev) => [
        { id: data.conversation.id, title: data.conversation.title, updatedAt: data.conversation.createdAt, preview: content.slice(0, 60) },
        ...prev,
      ]);
    }

    // Ajouter le message utilisateur
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: site.id,
          conversationId: convId,
          message: content,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Mettre à jour le titre de la conversation si c'est le premier message
      if (data.title) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, title: data.title, preview: content.slice(0, 60) } : c
          )
        );
      }
    } catch (error) {
      const errorDetail = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("[Chat Error]", error);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Erreur: ${errorDetail}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar conversations */}
      <div
        className={cn(
          "flex-shrink-0 border-r border-border bg-card/30 backdrop-blur-md flex flex-col transition-all duration-300 relative z-10",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-3 border-b border-border">
          <Button
            onClick={createNewConversation}
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs border-primary/30 hover:bg-primary/10 hover:text-primary hover:shadow-neon transition-all duration-300"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle conversation
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 px-2">
              Aucune conversation
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg text-xs transition-all duration-300",
                  activeConvId === conv.id
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-neon"
                    : "hover:bg-muted/60 text-muted-foreground hover:shadow-[0_0_10px_rgba(255,255,255,0.02)]"
                )}
              >
                <p className="font-medium truncate text-foreground">{conv.title}</p>
                {conv.preview && (
                  <p className="truncate text-muted-foreground mt-0.5">{conv.preview}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/30 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">WP_MNGR</p>
            <p className="text-xs text-muted-foreground">{site.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-xs text-muted-foreground">En ligne</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                Comment puis-je vous aider avec {site.name} ?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Décrivez ce que vous souhaitez faire sur votre site WordPress.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => handleSend(s.text)}
                    className="flex items-center gap-2.5 text-left p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm"
                  >
                    <s.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="chat-message-assistant">
                    <div className="flex items-center gap-1">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-border bg-card/20">
          <div className="flex items-end gap-2 bg-muted/50 rounded-2xl border border-border px-4 py-3 focus-within:border-primary/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Gérez ${site.name}...`}
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground leading-relaxed max-h-32 custom-scrollbar"
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
            <Button
              size="sm"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="h-8 w-8 p-0 rounded-xl flex-shrink-0 shadow-neon hover:shadow-neon-hover transition-all"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
          </p>
        </div>
      </div>
    </div>
  );
}
