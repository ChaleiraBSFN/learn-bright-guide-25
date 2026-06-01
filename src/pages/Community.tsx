import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Plus, Coins, Image as ImageIcon, BookOpen, Lightbulb, HelpCircle, Loader2, Trash2, Send, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PostType = 'exercise' | 'photo' | 'solution' | 'doubt';

interface CommunityPost {
  id: string;
  user_id: string;
  type: PostType;
  title: string;
  content: string | null;
  image_url: string | null;
  buddy_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null } | null;
  has_liked?: boolean;
}

interface CommunityComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null } | null;
}

const TYPE_META: Record<PostType, { label: string; icon: any; color: string }> = {
  exercise: { label: 'Exercício', icon: BookOpen, color: 'text-primary' },
  solution: { label: 'Solução', icon: Lightbulb, color: 'text-emerald-500' },
  doubt: { label: 'Dúvida', icon: HelpCircle, color: 'text-amber-500' },
  photo: { label: 'Foto', icon: ImageIcon, color: 'text-violet-500' },
};

function timeAgo(iso: string) {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR }); } catch { return ''; }
}

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<'all' | PostType>('all');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (filter !== 'all') q = q.eq('type', filter);
    const { data, error } = await q;
    if (error) { console.error(error); setLoading(false); return; }

    const ids = (data || []).map(p => p.user_id);
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', ids)
      : { data: [] as any[] };
    const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    let liked = new Set<string>();
    if (user) {
      const { data: likes } = await supabase
        .from('community_likes').select('post_id').eq('user_id', user.id)
        .in('post_id', (data || []).map(p => p.id));
      liked = new Set((likes || []).map((l: any) => l.post_id));
    }

    setPosts((data || []).map(p => ({
      ...p,
      type: p.type as PostType,
      author: profMap.get(p.user_id) || null,
      has_liked: liked.has(p.id),
    })));
    setLoading(false);
  }, [filter, user]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Realtime updates
  useEffect(() => {
    const ch = supabase
      .channel('community-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => loadPosts())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadPosts]);

  const toggleLike = async (post: CommunityPost) => {
    if (!user) { toast.error('Faça login para curtir'); return; }
    if (post.has_liked) {
      await supabase.from('community_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, has_liked: false, like_count: Math.max(0, p.like_count - 1) } : p));
    } else {
      const { error } = await supabase.from('community_likes').insert({ post_id: post.id, user_id: user.id });
      if (error) return;
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, has_liked: true, like_count: p.like_count + 1 } : p));
    }
  };

  const donateBuddy = async (post: CommunityPost) => {
    if (!user) { toast.error('Faça login para doar um buddy'); return; }
    if (post.user_id === user.id) { toast.info('Você não pode doar para o próprio post'); return; }
    const { data, error } = await supabase.rpc('donate_buddy', { _post_id: post.id });
    if (error) { toast.error(error.message.includes('Insufficient') ? 'Créditos insuficientes' : 'Não foi possível doar'); return; }
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, buddy_count: p.buddy_count + 1 } : p));
    window.dispatchEvent(new CustomEvent('credits_changed', { detail: { newTotal: data } }));
    toast.success('🎉 Buddy enviado! +1 crédito para o autor');
  };

  const deletePost = async (post: CommunityPost) => {
    if (!confirm('Apagar este post?')) return;
    const { error } = await supabase.from('community_posts').delete().eq('id', post.id);
    if (error) { toast.error('Erro ao apagar'); return; }
    setPosts(prev => prev.filter(p => p.id !== post.id));
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Comunidade — Studdy Buddy" description="Comunidade de estudantes: compartilhe exercícios, soluções e dúvidas." path="/community" />

      <header className="sticky top-0 z-30 border-b-2 border-foreground/10 bg-background/80 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl md:text-2xl font-bold flex-1">Comunidade</h1>
          {user && (
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Postar
            </Button>
          )}
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="exercise">Exercícios</TabsTrigger>
              <TabsTrigger value="solution">Soluções</TabsTrigger>
              <TabsTrigger value="doubt">Dúvidas</TabsTrigger>
              <TabsTrigger value="photo">Fotos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {!user && (
          <Card className="p-4 border-2 border-dashed text-center">
            <p className="text-sm text-muted-foreground mb-3">Faça login para postar, curtir, comentar e doar buddies.</p>
            <Button onClick={() => navigate('/auth')}>Entrar</Button>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum post ainda. Seja o primeiro!
          </Card>
        ) : (
          <AnimatePresence>
            {posts.map(post => (
              <motion.div key={post.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <PostCard
                  post={post}
                  currentUserId={user?.id}
                  onLike={() => toggleLike(post)}
                  onDonate={() => donateBuddy(post)}
                  onDelete={() => deletePost(post)}
                  onToggleComments={() => setOpenCommentsFor(openCommentsFor === post.id ? null : post.id)}
                  commentsOpen={openCommentsFor === post.id}
                  onCommentAdded={() => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comment_count: p.comment_count + 1 } : p))}
                  onCommentRemoved={() => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p))}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>

      <CreatePostDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); loadPosts(); }} />
    </div>
  );
}

// ============ Post card ============
function PostCard({ post, currentUserId, onLike, onDonate, onDelete, onToggleComments, commentsOpen, onCommentAdded, onCommentRemoved }: {
  post: CommunityPost;
  currentUserId?: string;
  onLike: () => void;
  onDonate: () => void;
  onDelete: () => void;
  onToggleComments: () => void;
  commentsOpen: boolean;
  onCommentAdded: () => void;
  onCommentRemoved: () => void;
}) {
  const meta = TYPE_META[post.type];
  const Icon = meta.icon;
  const isOwn = currentUserId === post.user_id;
  const initial = (post.author?.display_name || 'U').charAt(0).toUpperCase();

  return (
    <Card className="border-2 border-foreground/10 rounded-2xl overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-foreground/10">
          {post.author?.avatar_url && <AvatarImage src={post.author.avatar_url} />}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{post.author?.display_name || 'Estudante'}</span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted ${meta.color}`}>
              <Icon className="h-3 w-3" /> {meta.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
        </div>
        {isOwn && (
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Apagar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        )}
      </div>

      <div className="px-4 pb-3">
        <h3 className="font-bold text-base md:text-lg mb-1">{post.title}</h3>
        {post.content && <p className="text-sm whitespace-pre-wrap text-foreground/90">{post.content}</p>}
      </div>

      {post.image_url && (
        <img src={post.image_url} alt={post.title} loading="lazy" className="w-full max-h-[500px] object-contain bg-muted/40" />
      )}

      <div className="px-4 py-3 flex items-center gap-2 border-t border-foreground/5">
        <Button variant="ghost" size="sm" onClick={onLike} className={`gap-1.5 ${post.has_liked ? 'text-rose-500' : ''}`}>
          <Heart className={`h-4 w-4 ${post.has_liked ? 'fill-current' : ''}`} />
          {post.like_count}
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleComments} className="gap-1.5">
          <MessageCircle className="h-4 w-4" />
          {post.comment_count}
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={onDonate} disabled={isOwn} className="gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10">
          <Coins className="h-4 w-4" /> Doar Buddy · {post.buddy_count}
        </Button>
      </div>

      {commentsOpen && (
        <CommentsThread postId={post.id} currentUserId={currentUserId} onAdded={onCommentAdded} onRemoved={onCommentRemoved} />
      )}
    </Card>
  );
}

// ============ Comments ============
function CommentsThread({ postId, currentUserId, onAdded, onRemoved }: { postId: string; currentUserId?: string; onAdded: () => void; onRemoved: () => void }) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('community_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true }).limit(100);
    const ids = (data || []).map(c => c.user_id);
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', ids)
      : { data: [] as any[] };
    const m = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    setComments((data || []).map(c => ({ ...c, author: m.get(c.user_id) || null })));
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!currentUserId || !text.trim() || sending) return;
    setSending(true);
    const { data, error } = await supabase.from('community_comments').insert({ post_id: postId, user_id: currentUserId, content: text.trim() }).select('*').single();
    setSending(false);
    if (error) { toast.error('Erro ao comentar'); return; }
    setText('');
    setComments(prev => [...prev, { ...(data as any), author: null }]);
    onAdded();
    load();
  };

  const remove = async (c: CommunityComment) => {
    const { error } = await supabase.from('community_comments').delete().eq('id', c.id);
    if (error) return;
    setComments(prev => prev.filter(x => x.id !== c.id));
    onRemoved();
  };

  return (
    <div className="border-t border-foreground/5 bg-muted/30 px-4 py-3 space-y-3">
      {comments.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Seja o primeiro a comentar</p>}
      {comments.map(c => (
        <div key={c.id} className="flex items-start gap-2">
          <Avatar className="h-7 w-7">
            {c.author?.avatar_url && <AvatarImage src={c.author.avatar_url} />}
            <AvatarFallback className="text-xs">{(c.author?.display_name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 bg-background rounded-lg px-3 py-2 border border-foreground/5">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-xs">{c.author?.display_name || 'Estudante'}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
              {c.user_id === currentUserId && (
                <button onClick={() => remove(c)} className="ml-auto text-destructive/70 hover:text-destructive" aria-label="Apagar comentário">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{c.content}</p>
          </div>
        </div>
      ))}
      {currentUserId && (
        <div className="flex gap-2 pt-1">
          <Input value={text} onChange={e => setText(e.target.value)} placeholder="Escreva um comentário..." maxLength={2000}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="bg-background" />
          <Button onClick={send} disabled={!text.trim() || sending} size="icon" aria-label="Enviar">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// ============ Create post dialog ============
function CreatePostDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [type, setType] = useState<PostType>('exercise');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [moderating, setModerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setType('exercise'); setTitle(''); setContent(''); setImageFile(null); setImagePreview(null); };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (f.size > 4 * 1024 * 1024) { toast.error('Imagem máx. 4MB'); return; }
    setImageFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const fileToBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(f);
  });

  const submit = async () => {
    if (!user) { toast.error('Faça login'); return; }
    if (!title.trim()) { toast.error('Adicione um título'); return; }
    setSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Moderate image if present
      if (imageFile) {
        setModerating(true);
        const b64 = await fileToBase64(imageFile);
        const { data: modData, error: modErr } = await supabase.functions.invoke('moderate-community-image', { body: { imageBase64: b64 } });
        setModerating(false);
        if (modErr) { toast.error('Falha na verificação da imagem'); setSubmitting(false); return; }
        if (!modData?.safe) {
          toast.error('Imagem rejeitada', { description: modData?.reason || 'Conteúdo inadequado detectado.' });
          setSubmitting(false);
          return;
        }

        // Upload to storage
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('community-images').upload(path, imageFile, { contentType: imageFile.type, upsert: false });
        if (upErr) { toast.error('Falha ao enviar imagem'); setSubmitting(false); return; }
        imageUrl = supabase.storage.from('community-images').getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from('community_posts').insert({
        user_id: user.id, type, title: title.trim(),
        content: content.trim() || null, image_url: imageUrl,
      });
      if (error) { toast.error('Erro ao publicar'); setSubmitting(false); return; }

      toast.success('Post publicado!');
      reset();
      onCreated();
    } catch (e) {
      console.error(e);
      toast.error('Erro inesperado');
    } finally {
      setSubmitting(false);
      setModerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && (onClose(), reset())}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={v => setType(v as PostType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exercise">📚 Exercício</SelectItem>
                <SelectItem value="solution">💡 Solução</SelectItem>
                <SelectItem value="doubt">❓ Dúvida</SelectItem>
                <SelectItem value="photo">📷 Foto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} placeholder="Resumo curto" />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} maxLength={5000} placeholder="Detalhe seu exercício, dúvida ou solução..." rows={5} />
          </div>

          <div className="space-y-2">
            <Label>Imagem (opcional)</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            {imagePreview ? (
              <div className="relative rounded-lg border-2 overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-contain bg-muted/30" />
                <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2"
                  onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}>
                  Remover
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full border-dashed border-2 py-6" onClick={() => fileRef.current?.click()}>
                <ImageIcon className="h-4 w-4 mr-2" /> Anexar imagem (máx. 4MB)
              </Button>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Toda imagem passa por verificação automática contra conteúdo inadequado.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); reset(); }} disabled={submitting}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting || !title.trim()}>
            {moderating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando...</> :
             submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publicando...</> :
             'Publicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
