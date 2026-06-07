import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Send, Loader2, Sparkles, Trash2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import learnBuddyLogo from "@/assets/learn-buddy-logo.jpeg";

interface ChatImage {
  mimeType: string;
  data: string; // base64 (no data: prefix)
  preview: string; // data url for UI
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
  images?: { mimeType: string; data: string; preview: string }[];
}

const STORAGE_KEY = "lb_chat_buddy_messages";
const MAX_IMAGES = 3;
const MAX_DIM = 1280;
const JPEG_QUALITY = 0.82;

async function fileToCompressedBase64(file: File): Promise<ChatImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > MAX_DIM || height > MAX_DIM) {
    const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  const out = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = out.split(",")[1];
  return { mimeType: "image/jpeg", data: base64, preview: out };
}

const ChatBuddy = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<ChatImage[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      // strip image data from storage to keep it small; keep previews only of last 6
      const slim = messages.slice(-30).map(m => ({ ...m, images: m.images?.slice(0, 3) }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {}
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = MAX_IMAGES - pendingImages.length;
    const arr = Array.from(files).slice(0, slots);
    const added: ChatImage[] = [];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 15 * 1024 * 1024) {
        toast({ title: t("chatBuddy.imgTooBigTitle", "Imagem muito grande"), description: t("chatBuddy.imgTooBig", "Máx 15MB por imagem."), variant: "destructive" });
        continue;
      }
      try {
        added.push(await fileToCompressedBase64(f));
      } catch {
        toast({ title: "Erro", description: t("chatBuddy.imgFail", "Não foi possível ler a imagem."), variant: "destructive" });
      }
    }
    if (added.length) setPendingImages(p => [...p, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && pendingImages.length === 0) || loading) return;
    const userMsg: ChatMessage = {
      role: "user",
      text,
      images: pendingImages.map(i => ({ mimeType: i.mimeType, data: i.data, preview: i.preview })),
    };
    const next: ChatMessage[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPendingImages([]);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const recent = next.slice(-12).map(m => ({
        role: m.role,
        text: m.text || "",
        images: m.images?.map(i => ({ mimeType: i.mimeType, data: i.data })),
      }));
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-buddy`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: recent, idioma: i18n.language }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("chatBuddy.error", "Falha ao responder."));
      }
      const data = await res.json();
      setMessages(m => [...m, { role: "model", text: data.reply }]);
    } catch (e: any) {
      toast({ title: t("chatBuddy.errorTitle", "Erro"), description: e.message, variant: "destructive" });
      setMessages(messages);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const clearChat = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith("image/"));
    if (files.length > 0) {
      e.preventDefault();
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      onPickFiles(dt.files);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <SEO title="Chat Buddy — Learn Buddy" description="Converse com o Learn Buddy: tutor IA para exercícios, código, estudos e dúvidas." path="/chat-buddy" />

      <header className="sticky top-0 z-30 border-b-2 border-foreground/15 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="Voltar"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <img src={learnBuddyLogo} alt="Learn Buddy" className="h-9 w-9 rounded-xl border-2 border-foreground/15 shadow-sm" />
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-lg font-bold leading-tight truncate">{t("chatBuddy.title", "Chat Buddy")}</h1>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">{t("chatBuddy.subtitle", "Seu tutor IA — pergunte qualquer coisa ✨")}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearChat} aria-label={t("chatBuddy.clear", "Limpar conversa")} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10 sm:py-16 px-4 space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-foreground/10 shadow-lg">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold">{t("chatBuddy.heroTitle", "Olá! Em que posso ajudar?")}</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{t("chatBuddy.heroDesc", "Pergunte sobre matérias, peça exercícios, ajuda com código, roteiros de estudo, ou envie uma foto de um exercício.")}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto pt-2">
                {[
                  t("chatBuddy.s1", "Me explique fotossíntese de forma simples"),
                  t("chatBuddy.s2", "Crie um plano de estudo de 7 dias para matemática"),
                  t("chatBuddy.s3", "Escreva uma função em Python para ordenar lista"),
                  t("chatBuddy.s4", "Me dê 3 exercícios sobre equação do 2º grau"),
                ].map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} className="text-left text-xs sm:text-sm rounded-xl border-2 border-foreground/10 bg-background/60 hover:bg-primary/5 hover:border-primary/30 px-3 py-2.5 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "model" && (
                <img src={learnBuddyLogo} alt="" className="h-8 w-8 rounded-lg border border-foreground/15 mr-2 shrink-0 self-start mt-0.5" />
              )}
              <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border-2 border-foreground/10 rounded-bl-md"
              }`}>
                {m.images && m.images.length > 0 && (
                  <div className={`flex flex-wrap gap-1.5 ${m.text ? "mb-2" : ""}`}>
                    {m.images.map((img, idx) => (
                      <img key={idx} src={img.preview} alt="" className="max-h-48 rounded-lg border border-foreground/15 object-cover" />
                    ))}
                  </div>
                )}
                {m.role === "model" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg prose-pre:text-xs prose-code:text-xs prose-headings:font-display prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                ) : (
                  m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <img src={learnBuddyLogo} alt="" className="h-8 w-8 rounded-lg border border-foreground/15 mr-2 shrink-0" />
              <div className="bg-card border-2 border-foreground/10 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </main>

      <footer className="sticky bottom-0 border-t-2 border-foreground/15 bg-background/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img.preview} alt="" className="h-16 w-16 object-cover rounded-lg border-2 border-foreground/15" />
                  <button
                    type="button"
                    onClick={() => setPendingImages(p => p.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
                    aria-label="Remover"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border-2 border-foreground/15 bg-background p-2 shadow-md focus-within:border-primary/50 transition-colors">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onPickFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileRef.current?.click()}
              disabled={loading || pendingImages.length >= MAX_IMAGES}
              className="h-10 w-10 rounded-xl shrink-0 text-muted-foreground hover:text-primary"
              aria-label={t("chatBuddy.addImage", "Anexar imagem")}
              title={t("chatBuddy.addImage", "Anexar imagem")}
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
            <Textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              onPaste={onPaste}
              placeholder={t("chatBuddy.placeholder", "Pergunte qualquer coisa…")}
              className="flex-1 min-h-[44px] max-h-40 resize-none border-0 bg-transparent focus-visible:ring-0 text-sm px-2 py-2"
              disabled={loading}
            />
            <Button onClick={send} disabled={loading || (!input.trim() && pendingImages.length === 0)} size="icon" className="h-10 w-10 rounded-xl shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">{t("chatBuddy.disclaimer", "Powered by Gemini · pode cometer erros, verifique informações importantes.")}</p>
        </div>
      </footer>
    </div>
  );
};

export default ChatBuddy;
