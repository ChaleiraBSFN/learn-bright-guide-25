import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Send, Loader2, MessageCircle } from 'lucide-react';

interface SupportUser {
  user_id: string;
  email: string;
  display_name: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  admin_id: string | null;
  created_at: string;
}

const SupportAdmin = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<SupportUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SupportUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadSupportUsers();
      
      const channel = supabase
        .channel('admin-support')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
          },
          () => {
            loadSupportUsers();
            if (selectedUser) {
              loadMessages(selectedUser.user_id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin, selectedUser]);

  const loadSupportUsers = async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select(`
        user_id,
        message,
        created_at,
        is_admin_reply
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading support users:', error);
      setLoading(false);
      return;
    }

    // Group by user and get latest message
    const userMap = new Map<string, SupportUser>();
    
    for (const msg of data || []) {
      if (!userMap.has(msg.user_id)) {
        // Get profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('user_id', msg.user_id)
          .single();

        userMap.set(msg.user_id, {
          user_id: msg.user_id,
          email: profile?.email || 'Unknown',
          display_name: profile?.display_name,
          last_message: msg.message,
          last_message_at: msg.created_at,
          unread_count: msg.is_admin_reply ? 0 : 1,
        });
      } else if (!msg.is_admin_reply) {
        const existing = userMap.get(msg.user_id)!;
        existing.unread_count++;
      }
    }

    setUsers(Array.from(userMap.values()));
    setLoading(false);
  };

  const loadMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const selectUser = (supportUser: SupportUser) => {
    setSelectedUser(supportUser);
    loadMessages(supportUser.user_id);
  };

  const sendReply = async () => {
    if (!user || !selectedUser || !newMessage.trim()) return;
    setSending(true);

    const { error } = await supabase
      .from('support_messages')
      .insert({
        user_id: selectedUser.user_id,
        message: newMessage.trim(),
        is_admin_reply: true,
        admin_id: user.id,
      });

    if (error) {
      console.error('Error sending reply:', error);
    } else {
      setNewMessage('');
      loadMessages(selectedUser.user_id);
    }
    setSending(false);
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">{t('support.adminTitle')}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Users List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t('support.conversations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-18rem)]">
                {users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 px-4">
                    {t('support.noConversations')}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {users.map((u) => (
                      <button
                        key={u.user_id}
                        onClick={() => selectUser(u)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b ${
                          selectedUser?.user_id === u.user_id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {u.display_name || u.email.split('@')[0]}
                          </p>
                          {u.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                              {u.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {u.email}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {u.last_message}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">
                {selectedUser
                  ? selectedUser.display_name || selectedUser.email
                  : t('support.selectConversation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4">
              {selectedUser ? (
                <>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg max-w-[85%] ${
                            msg.is_admin_reply
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted text-foreground mr-auto'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="mt-4 flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('support.replyPlaceholder')}
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />
                    <Button
                      onClick={sendReply}
                      disabled={sending || !newMessage.trim()}
                      size="icon"
                      className="shrink-0"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  {t('support.selectConversation')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SupportAdmin;
