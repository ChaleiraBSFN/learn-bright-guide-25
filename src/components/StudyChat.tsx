import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FormattedExplanation } from "@/components/FormattedExplanation";
import learnBuddyLogo from "@/assets/learn-buddy-logo.png";

interface Msg {
  role: "user" | "model";
  text: string;
}

interface StudyChatProps {
  /** Tema do estudo gerado, usado como contexto. */
  tema: string;
  /** Resumo textual do conteúdo gerado (contexto para a IA). */
  contexto: string;
}

const SUGGESTION_KEYS = [
  { key: "exercise", fallback: "Quero tentar um exercício" },
  { key: "simpler", fallback: "Explica de um jeito mais simples" },
  { key: "example", fallback: "Me dá outro exemplo" },
  { key: "exam", fallback: "Como isso cai na prova?" },
];

export function StudyChat({ tema, contexto }: StudyChatProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;
    const next: Msg[] = [...messages, { role: "user", text: clean }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("study-chat", {
        body: {
          tema,
          contexto: contexto.slice(0, 6000),
          idioma: i18n.language,
          messages: next.slice(-10).map((m) => ({ role: m.role, text: m.text })),
        },
      });
      if (error) throw error;
      const answer = (data as { resposta?: string })?.resposta;
      if (!answer) throw new Error("empty");
      setMessages((prev) => [...prev, { role: "model", text: answer }]);
    } catch (e) {
      setMessages((prev) => prev.slice(0, -1));
      setInput(clean);
      toast({
        title: t("studyChat.errorTitle", "Não consegui responder agora"),
        description: t("studyChat.errorDesc", "Tente de novo em alguns segundos."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="liquid-glass mt-6 p-4 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <img src={learnBuddyLogo} alt="Learn Buddy" className="h-9 w-9 rounded-xl object-cover" />
        <div>
          <h3 className="font-display text-base font-bold text-foreground md:text-lg">
            {t("studyChat.title", "Continue perguntando")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("studyChat.subtitle", "Tire dúvidas sobre este estudo, sem sair da página.")}
          </p>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mb-4 space-y-3">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="rounded-2xl bg-card/60 p-4">
                <FormattedExplanation text={m.text} />
              </div>
            )
          )}
          {loading && (
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("studyChat.thinking", "Pensando...")}
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        {SUGGESTION_KEYS.map((s) => (
          <button
            key={s.key}
            type="button"
            disabled={loading}
            onClick={() => send(t(`studyChat.suggestions.${s.key}`, s.fallback))}
            className="chip-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/90 disabled:opacity-50"
          >
            <MessageCircleQuestion className="h-3.5 w-3.5 text-primary" />
            {t(`studyChat.suggestions.${s.key}`, s.fallback)}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder={t("studyChat.placeholder", "Pergunte alguma coisa sobre este conteúdo")}
          className="min-h-[46px] resize-none rounded-2xl bg-card/60"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !input.trim()}
          aria-label={t("studyChat.send", "Enviar")}
          className="liquid-btn h-[46px] w-[46px] shrink-0 rounded-2xl"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </section>
  );
}
