import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { HelpCircle, Send, Loader2, MessagesSquare, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

export const SupportChat = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user) {
      loadMessages();
      
      const channel = supabase
        .channel('support-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;
    setSending(true);

    const messageContent = newMessage.trim();

    const { data: insertedMessage, error } = await supabase
      .from('support_messages')
      .insert({
        user_id: user.id,
        message: messageContent,
        is_admin_reply: false,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: t('support.error'),
        description: t('support.sendError'),
        variant: 'destructive',
      });
    } else {
      setNewMessage('');
      
      try {
        await supabase.functions.invoke('notify-support-request', {
          body: { 
            message: messageContent,
            messageId: insertedMessage?.id
          }
        });
      } catch (notifyError) {
        console.error('Failed to send admin notification:', notifyError);
      }
    }
    setSending(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{t('support.help')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{t('support.chatTitle')}</SheetTitle>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 mt-2 self-start"
              onClick={() => {
                setOpen(false);
                navigate('/support-admin');
              }}
            >
              <MessagesSquare className="h-4 w-4" />
              Lista de chats
            </Button>
          )}
        </SheetHeader>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  Crie uma conta para falar conosco
                </h3>
                <p className="text-sm text-muted-foreground max-w-[260px]">
                  Entre com sua conta para acessar o suporte e conversar diretamente com nossa equipe.
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setOpen(false);
                navigate('/auth');
              }}
              className="w-full max-w-[240px] gap-2"
            >
              <LogIn className="h-4 w-4" />
              Entrar ou Cadastrar
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4 mt-4" ref={scrollRef}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('support.noMessages')}
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg max-w-[85%] ${
                        msg.is_admin_reply
                          ? 'bg-primary/10 text-foreground mr-auto'
                          : 'bg-primary text-primary-foreground ml-auto'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('support.placeholder')}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                size="icon"
                className="shrink-0"
                aria-label={t('support.send')}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
