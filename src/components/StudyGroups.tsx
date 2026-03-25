import { useState, useEffect, useRef, useCallback } from 'react';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users, Plus, Send, Loader2, ArrowLeft, Settings, UserPlus,
  Copy, Crown, Shield, Trash2, LogOut, Image as ImageIcon, History,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Group {
  id: string;
  name: string;
  description: string | null;
  max_members: number;
  created_by: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { display_name: string | null; email: string; avatar_url: string | null };
}

interface ChatMessage {
  id: string;
  user_id: string;
  message: string | null;
  image_url: string | null;
  created_at: string;
  profile?: { display_name: string | null; email: string };
}

interface HistoryItem {
  id: string;
  topic: string;
  type: string;
  created_at: string;
  level: string | null;
  display_name: string | null;
}

type View = 'list' | 'chat' | 'settings' | 'history';

export const StudyGroups = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('list');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [memberHistory, setMemberHistory] = useState<HistoryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Create group state
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupMax, setGroupMax] = useState(10);
  const [creating, setCreating] = useState(false);

  // Invite state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const loadGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('study_groups')
      .select('*')
      .order('created_at', { ascending: false });
    setGroups(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open && user) loadGroups();
  }, [open, user, loadGroups]);

  const loadMembers = async (groupId: string) => {
    const { data } = await supabase
      .from('study_group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at');
    
    if (data) {
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .in('user_id', userIds);
      
      const membersWithProfiles = data.map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id),
      }));
      setMembers(membersWithProfiles);
    }
  };

  const loadMessages = async (groupId: string) => {
    const { data } = await supabase
      .from('study_group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(200);
    
    if (data) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);
      
      setMessages(data.map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id),
      })));
    }
  };

  const loadMemberHistory = async (groupId: string) => {
    const { data: history } = await supabase
      .rpc('get_group_member_history', { _group_id: groupId });
    setMemberHistory((history as any[]) || []);
  };

  const openGroup = async (group: Group) => {
    setSelectedGroup(group);
    setView('chat');
    await Promise.all([loadMembers(group.id), loadMessages(group.id)]);
    
    // Subscribe to realtime messages
    const channel = supabase
      .channel(`group-${group.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'study_group_messages',
        filter: `group_id=eq.${group.id}`,
      }, async (payload) => {
        const newMsg = payload.new as ChatMessage;
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .eq('user_id', newMsg.user_id)
          .single();
        setMessages(prev => [...prev, { ...newMsg, profile: profile || undefined }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createGroup = async () => {
    if (!user || !groupName.trim()) return;
    setCreating(true);
    
    const { data: group, error } = await supabase
      .from('study_groups')
      .insert({ name: groupName.trim(), description: groupDesc.trim() || null, max_members: groupMax, created_by: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: t('groups.error'), description: t('groups.createError'), variant: 'destructive' });
    } else if (group) {
      // Add creator as owner
      await supabase.from('study_group_members').insert({ group_id: group.id, user_id: user.id, role: 'owner' });
      setCreateOpen(false);
      setGroupName('');
      setGroupDesc('');
      setGroupMax(10);
      loadGroups();
      toast({ title: t('groups.created'), description: t('groups.createdDesc') });
    }
    setCreating(false);
  };

  const sendMessage = async () => {
    if (!user || !selectedGroup || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from('study_group_messages')
      .insert({ group_id: selectedGroup.id, user_id: user.id, message: newMessage.trim() });
    if (error) {
      toast({ title: t('groups.error'), description: t('groups.sendError'), variant: 'destructive' });
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const sendInvite = async () => {
    if (!user || !selectedGroup || !inviteEmail.trim()) return;
    setInviting(true);

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', inviteEmail.trim())
      .single();

    if (existingProfile) {
      // Directly add to group
      const { error } = await supabase
        .from('study_group_members')
        .insert({ group_id: selectedGroup.id, user_id: existingProfile.user_id, role: 'member' });
      if (error) {
        toast({ title: t('groups.error'), description: error.message.includes('duplicate') ? t('groups.alreadyMember') : t('groups.inviteError'), variant: 'destructive' });
      } else {
        toast({ title: t('groups.memberAdded'), description: t('groups.memberAddedDesc') });
        loadMembers(selectedGroup.id);
      }
    } else {
      // Create invite with token
      const { data: invite, error } = await supabase
        .from('study_group_invites')
        .insert({ group_id: selectedGroup.id, invited_by: user.id, invite_email: inviteEmail.trim() })
        .select()
        .single();
      if (error) {
        toast({ title: t('groups.error'), description: t('groups.inviteError'), variant: 'destructive' });
      } else if (invite) {
        const link = `${window.location.origin}/auth?invite=${invite.invite_token}`;
        setInviteLink(link);
        toast({ title: t('groups.inviteSent'), description: t('groups.inviteSentDesc') });
      }
    }
    setInviteEmail('');
    setInviting(false);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: t('groups.copied'), description: t('groups.linkCopied') });
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    await supabase.from('study_group_members').update({ role: newRole }).eq('id', memberId);
    if (selectedGroup) loadMembers(selectedGroup.id);
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('study_group_members').delete().eq('id', memberId);
    if (selectedGroup) loadMembers(selectedGroup.id);
  };

  const leaveGroup = async () => {
    if (!user || !selectedGroup) return;
    await supabase.from('study_group_members').delete().eq('group_id', selectedGroup.id).eq('user_id', user.id);
    setView('list');
    setSelectedGroup(null);
    loadGroups();
  };

  const deleteGroup = async () => {
    if (!selectedGroup) return;
    await supabase.from('study_groups').delete().eq('id', selectedGroup.id);
    setView('list');
    setSelectedGroup(null);
    loadGroups();
  };

  const updateGroupSettings = async (name: string, maxMembers: number) => {
    if (!selectedGroup) return;
    await supabase.from('study_groups').update({ name, max_members: maxMembers }).eq('id', selectedGroup.id);
    setSelectedGroup({ ...selectedGroup, name, max_members: maxMembers });
    toast({ title: t('groups.updated') });
  };

  const currentUserRole = members.find(m => m.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';

  const [groupCropSrc, setGroupCropSrc] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setGroupCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCroppedImageUpload = async (croppedFile: File) => {
    if (!user || !selectedGroup) return;
    const filePath = `group-images/${selectedGroup.id}/${Date.now()}.jpg`;
    
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, croppedFile);
    if (uploadError) {
      toast({ title: t('groups.error'), description: t('groups.imageError'), variant: 'destructive' });
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    await supabase.from('study_group_messages').insert({
      group_id: selectedGroup.id,
      user_id: user.id,
      image_url: publicUrl,
    });
  };

  const navigate = useNavigate();

  if (!user) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 !min-w-12 !min-h-12 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-accent/30 hover:bg-accent hover:text-accent-foreground transition-all shadow-[0_4px_14px_-3px_hsl(var(--accent)/0.4),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(var(--accent)/0.15)]"
        onClick={() => {
          toast({
            title: t('groups.loginRequired'),
            description: t('groups.loginRequiredDesc'),
          });
          navigate('/auth');
        }}
      >
        <Users className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <>
    <ImageCropDialog
      open={!!groupCropSrc}
      onClose={() => setGroupCropSrc(null)}
      imageSrc={groupCropSrc || ''}
      onCropComplete={handleCroppedImageUpload}
      fileName="group-image.jpg"
    />
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-12 w-12 !min-w-12 !min-h-12 shrink-0 p-0 flex items-center justify-center rounded-full bg-background/95 backdrop-blur-sm border-2 border-accent/30 hover:bg-accent hover:text-accent-foreground transition-all shadow-[0_4px_14px_-3px_hsl(var(--accent)/0.4),inset_0_1px_0_hsl(0_0%_100%/0.2),inset_0_-2px_0_hsl(var(--accent)/0.15)]">
          <Users className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center gap-2">
          {view !== 'list' && (
            <Button variant="ghost" size="icon" onClick={() => {
              if (view === 'settings' || view === 'history') setView('chat');
              else { setView('list'); setSelectedGroup(null); }
            }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <SheetTitle className="flex-1">
            {view === 'list' && t('groups.title')}
            {view === 'chat' && selectedGroup?.name}
            {view === 'settings' && t('groups.settings')}
            {view === 'history' && t('groups.memberHistory')}
          </SheetTitle>
          {view === 'chat' && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => { setView('history'); if (selectedGroup) loadMemberHistory(selectedGroup.id); }}>
                <History className="h-4 w-4" />
              </Button>
              {isAdmin && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => setInviteOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setView('settings')}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="flex-1 flex flex-col">
            <div className="p-4">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    {t('groups.create')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('groups.create')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder={t('groups.namePlaceholder')} value={groupName} onChange={e => setGroupName(e.target.value)} />
                    <Textarea placeholder={t('groups.descPlaceholder')} value={groupDesc} onChange={e => setGroupDesc(e.target.value)} />
                    <div>
                      <label className="text-sm font-medium">{t('groups.maxMembers')}</label>
                      <Input type="number" min={2} max={100} value={groupMax} onChange={e => setGroupMax(Number(e.target.value))} />
                    </div>
                    <Button onClick={createGroup} disabled={creating || !groupName.trim()} className="w-full">
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('groups.create')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="flex-1 px-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : groups.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('groups.empty')}</p>
              ) : (
                <div className="space-y-2 pb-4">
                  {groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => openGroup(g)}
                      className="w-full text-left p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{g.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {g.max_members}
                        </Badge>
                      </div>
                      {g.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{g.description}</p>}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* CHAT VIEW */}
        {view === 'chat' && selectedGroup && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Members bar */}
            <div className="px-4 py-2 border-b border-border flex gap-1 overflow-x-auto">
              {members.map(m => (
                <Badge key={m.id} variant={m.role === 'owner' ? 'default' : 'outline'} className="shrink-0 text-xs">
                  {m.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                  {m.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                  {m.profile?.display_name || m.profile?.email?.split('@')[0] || '?'}
                </Badge>
              ))}
            </div>
            
            <ScrollArea className="flex-1 px-4 py-2" ref={scrollRef}>
              <div className="space-y-3">
                {messages.map(msg => {
                  const isMe = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-muted-foreground mb-1">
                        {msg.profile?.display_name || msg.profile?.email?.split('@')[0]}
                      </span>
                      <div className={`p-3 rounded-lg max-w-[80%] ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                        {msg.image_url && (
                          <img src={msg.image_url} alt="" className="rounded-md max-w-full max-h-48 mt-1" />
                        )}
                        <p className="text-xs opacity-60 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border flex gap-2">
              <label className="cursor-pointer shrink-0">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                <Button variant="ghost" size="icon" asChild><span><ImageIcon className="h-4 w-4" /></span></Button>
              </label>
              <Textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder={t('groups.messagePlaceholder')}
                className="min-h-[40px] max-h-[100px] resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon" className="shrink-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {view === 'settings' && selectedGroup && (
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Group Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">{t('groups.groupInfo')}</h3>
                <Input defaultValue={selectedGroup.name} id="edit-name" />
                <div>
                  <label className="text-sm font-medium">{t('groups.maxMembers')}</label>
                  <Input type="number" defaultValue={selectedGroup.max_members} id="edit-max" min={2} max={100} />
                </div>
                <Button onClick={() => {
                  const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
                  const max = Number((document.getElementById('edit-max') as HTMLInputElement)?.value);
                  if (name) updateGroupSettings(name, max);
                }}>{t('groups.save')}</Button>
              </div>

              {/* Members Management */}
              <div className="space-y-3">
                <h3 className="font-semibold">{t('groups.members')} ({members.length})</h3>
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-sm">{m.profile?.display_name || m.profile?.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {m.role === 'owner' ? <><Crown className="h-3 w-3 mr-1" />{t('groups.owner')}</> :
                         m.role === 'admin' ? <><Shield className="h-3 w-3 mr-1" />{t('groups.admin')}</> :
                         t('groups.member')}
                      </Badge>
                    </div>
                    {currentUserRole === 'owner' && m.user_id !== user?.id && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => updateMemberRole(m.id, m.role === 'admin' ? 'member' : 'admin')}>
                          <Shield className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full gap-2 text-destructive" onClick={leaveGroup}>
                  <LogOut className="h-4 w-4" /> {t('groups.leave')}
                </Button>
                {currentUserRole === 'owner' && (
                  <Button variant="destructive" className="w-full gap-2" onClick={deleteGroup}>
                    <Trash2 className="h-4 w-4" /> {t('groups.delete')}
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* HISTORY VIEW */}
        {view === 'history' && (
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {memberHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('groups.noHistory')}</p>
              ) : memberHistory.map(h => (
                <div key={h.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Badge variant={h.type === 'study' ? 'default' : 'secondary'} className="text-xs">
                      {h.type === 'study' ? t('tabs.study') : t('tabs.exercises')}
                    </Badge>
                    {h.level && <Badge variant="outline" className="text-xs">{h.level}</Badge>}
                    {h.display_name && <span className="text-xs text-muted-foreground ml-auto">{h.display_name}</span>}
                  </div>
                  <p className="font-medium text-sm mt-1">{h.topic}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* INVITE DIALOG */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('groups.invite')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('groups.inviteDesc')}</p>
              <div className="flex gap-2">
                <Input placeholder={t('groups.emailPlaceholder')} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                <Button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>
              {inviteLink && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('groups.inviteLink')}</p>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="text-xs" />
                    <Button variant="outline" size="icon" onClick={copyInviteLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
    </>
  );
};
