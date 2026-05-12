import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold mb-8 hover:underline">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          {t("header.back")}
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: 12 de Maio de 2026</p>

        <div className="space-y-8">
          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">1. Quem Somos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Learn Buddy ("nós", "nosso" ou "o aplicativo") é uma plataforma educacional gratuita desenvolvida por Marcelo Soares de Macedo. Nosso objetivo é ajudar estudantes a aprender qualquer tema com o auxílio de inteligência artificial. Nossa sede virtual opera através do domínio <strong>studdybuddy.com.br</strong>.
            </p>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">2. Dados que Coletamos</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Coletamos apenas os dados estritamente necessários para o funcionamento do aplicativo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li><strong>Dados de conta:</strong> e-mail, nome de exibição e senha criptografada (quando você cria uma conta).</li>
              <li><strong>Perfil:</strong> foto de perfil (avatar) opcional, que você pode enviar e remover a qualquer momento.</li>
              <li><strong>Histórico de estudo:</strong> temas pesquisados, exercícios respondidos, planos de estudo gerados e progresso na trilha de aprendizado.</li>
              <li><strong>Imagens:</strong> fotos de exercícios ou materiais que você envia para análise via OCR (processadas e descartadas automaticamente pela IA).</li>
              <li><strong>Dados técnicos:</strong> idioma preferido, preferências de configuração e estatísticas anônimas de uso.</li>
            </ul>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">3. Como Usamos Seus Dados</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Utilizamos seus dados exclusivamente para:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>Gerar conteúdo educativo personalizado (resumos, exercícios, planos de estudo).</li>
              <li>Manter seu histórico de estudos acessível em todos os dispositivos.</li>
              <li>Gerenciar o sistema de créditos e gamificação (trilha de progresso, ranking).</li>
              <li>Permitir participação em grupos de estudo (apenas com seu consentimento).</li>
              <li>Melhorar a qualidade das respostas da IA com base no contexto de estudo.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              <strong>Nunca vendemos seus dados</strong> para terceiros. Nunca usamos seus dados para publicidade direcionada.
            </p>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">4. Inteligência Artificial e Processamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Learn Buddy utiliza a API do <strong>Google Gemini</strong> para gerar conteúdo educacional. Quando você envia um tema, exercício ou imagem, processamos essas informações através de servidores seguros da Google. Os dados enviados para a IA são:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mt-2">
              <li>Processados em tempo real para gerar respostas educacionais.</li>
              <li>Não armazenados permanentemente nos servidores da Google para fins de treinamento (conforme política atual do Gemini API).</li>
              <li>Transmitidos via conexões criptografadas (TLS/SSL).</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Imagens enviadas para análise OCR são convertidas em texto e descartadas imediatamente após o processamento.
            </p>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">5. Cookies e Tecnologias Semelhantes</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Learn Buddy utiliza <strong>localStorage</strong> e <strong>cookies essenciais</strong> para manter sua sessão de login, preferências de idioma e configurações do aplicativo. Não utilizamos cookies de rastreamento de terceiros, pixels de conversão ou ferramentas de análise de comportamento.
            </p>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">6. Crianças e Adolescentes</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Learn Buddy é direcionado a estudantes de todas as idades. Crianças menores de 13 anos devem usar o aplicativo com supervisão de um responsável legal. Não coletamos intencionalmente dados pessoais de crianças sem o consentimento dos pais. Se você é responsável e descobrir que seu filho nos forneceu dados pessoais, entre em contato para remoção imediata.
            </p>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">7. Segurança dos Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mt-2">
              <li>Criptografia TLS/SSL para todas as transmissões de dados.</li>
              <li>Autenticação segura via JWT com refresh tokens.</li>
              <li>Políticas de segurança a nível de banco de dados (RLS - Row Level Security).</li>
              <li>Validação de permissões em todas as operações de leitura/escrita.</li>
              <li>Limites de upload de arquivos (máx. 2MB) para prevenir abusos.</li>
            </ul>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">8. Seus Direitos (LGPD/GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Você tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li><strong>Acesso:</strong> visualizar todos os dados que temos sobre você (disponível na página de Configurações).</li>
              <li><strong>Correção:</strong> atualizar seu nome, e-mail ou foto de perfil a qualquer momento.</li>
              <li><strong>Exclusão:</strong> solicitar a remoção completa da sua conta e todos os dados associados.</li>
              <li><strong>Portabilidade:</strong> exportar seu histórico de estudos.</li>
              <li><strong>Revogação:</strong> revogar consentimentos dados anteriormente.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Para exercer esses direitos, entre em contato pelo e-mail listado abaixo ou utilize a página de Configurações do aplicativo.
            </p>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">9. Compartilhamento com Terceiros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não compartilhamos seus dados pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mt-2">
              <li><strong>Google (Gemini API):</strong> apenas para processamento de conteúdo educacional em tempo real.</li>
              <li><strong>Provedores de infraestrutura:</strong> servidores de hospedagem e banco de dados (operados sob contratos de confidencialidade).</li>
              <li><strong>Obrigação legal:</strong> se formos obrigados por lei ou ordem judicial a divulgar informações.</li>
            </ul>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">10. Retenção de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir sua conta, todos os dados pessoais são removidos permanentemente em até 30 dias. Dados anonimizados e agregados (como estatísticas de uso) podem ser retidos para fins de melhoria do serviço, sem identificação individual.
            </p>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">11. Alterações nesta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas através de um aviso no aplicativo ou por e-mail. A data da "última atualização" no topo desta página indica quando a política foi modificada pela última vez.
            </p>
          </section>

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">12. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas, preocupações ou solicitações relacionadas à privacidade, entre em contato:
            </p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p><strong>Responsável:</strong> Marcelo Soares de Macedo</p>
              <p><strong>Website:</strong> studdybuddy.com.br</p>
              <p><strong>E-mail:</strong> suporte@studdybuddy.com.br</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-foreground/20 text-center">
          <p className="text-sm text-muted-foreground">
            Ao utilizar o Learn Buddy, você concorda com os termos desta Política de Privacidade. Se não concordar, por favor, não utilize o aplicativo.
          </p>
          <Link to="/" className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:opacity-90 transition-opacity">
            Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
