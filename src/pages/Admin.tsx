import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, BarChart3, Cpu, Loader2, Map, Megaphone, MessageCircle, Settings2, Shield } from 'lucide-react';
import TrailVisualEditor from '@/components/admin/TrailVisualEditor';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [viewEditor, setViewEditor] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {viewEditor ? (
          <TrailVisualEditor onBack={() => setViewEditor(false)} />
        ) : (
          <>
            <div className="mb-8 flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => navigate('/manage-users')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Analytics
                  </CardTitle>
                  <CardDescription>Veja estatísticas de uso da plataforma</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => navigate('/support-admin')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Suporte
                  </CardTitle>
                  <CardDescription>Responda mensagens dos usuários</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => navigate('/engine-notices')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Aviso de Motores
                  </CardTitle>
                  <CardDescription>Gerencie status e avisos dos motores da IA</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => navigate('/update-notices')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-accent" />
                    Avisos de Atualizações
                  </CardTitle>
                  <CardDescription>Publique avisos chamativos sobre próximas atualizações</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => navigate('/platform-control')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-secondary" />
                    Controle da Plataforma
                  </CardTitle>
                  <CardDescription>Ative/desative funcionalidades, trilha, grupos e mais</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => setViewEditor(true)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-primary" />
                    Editor da Trilha
                  </CardTitle>
                  <CardDescription>Edite a trilha direto no mapa visual, sem coordenadas manuais</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer transition-colors hover:border-primary" onClick={() => navigate('/ai-config')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-amber-500" />
                    Dados da IA
                  </CardTitle>
                  <CardDescription>Configure métricas, modelos e capacidades exibidas</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
