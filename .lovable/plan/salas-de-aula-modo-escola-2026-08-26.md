# Salas de Aula (modo escola)

Sistema de turmas gerenciadas por um professor (conta obrigatória) com alunos entrando sem conta, por link ou chave, informando apenas um nome de exibição.

## Como vai funcionar

**Professor (com conta)**
- Novo botão "Sala de Aula" no menu do ícone da conta e uma nova aba "Salas de Aula" dentro do botão de Grupos de Estudo.
- Pode criar várias salas. Cada sala tem: nome, matéria, chave de acesso definida por ele (ex.: `BIO7A`), link de convite e botão abrir/fechar entrada.
- Painel da sala: lista de alunos presentes, chat, materiais publicados, exercícios e o modo "ao vivo".
- Só o professor gera conteúdo (usa os créditos dele). Alunos não geram nada.
- Pode apagar a sala; ao apagar, alunos, mensagens e respostas somem junto.

**Aluno (sem conta)**
- Abre o link `/sala/CHAVE` (ou digita a chave em `/sala`), digita o nome que quer usar e entra.
- Vê: a apresentação ao vivo do professor, a biblioteca de materiais publicados, os exercícios para responder e o chat da turma.
- Pode escolher o idioma da interface e pedir a tradução do material publicado (9 idiomas já suportados).

**Apresentação — dois modos**
1. Ao vivo: o professor abre um conteúdo e marca "apresentar"; a tela dos alunos acompanha em tempo real (slide/seção atual sincronizada).
2. Biblioteca: materiais e exercícios publicados ficam na sala para o aluno acessar quando quiser.

**Exercícios**
- Professor gera exercícios (fluxo atual) e publica na sala.
- Aluno responde; o professor vê as respostas por aluno e o percentual de acertos em objetivas.

## LGPD

- Coleta mínima: só o nome de exibição digitado pelo aluno. Nada de e-mail, CPF, data de nascimento ou login.
- Aviso claro na tela de entrada: o que é coletado, para quê, por quanto tempo, e que o professor é o responsável pelos dados da turma.
- Recomendação explícita ao aluno de usar apenas o primeiro nome ou apelido, e bloqueio de campos livres com dados sensíveis no cadastro de entrada.
- Retenção: sessões de aluno inativas por 90 dias são apagadas automaticamente; professor pode remover um aluno e seus dados a qualquer momento; apagar a sala apaga tudo.
- Nada de perfil publicitário para alunos: nenhum anúncio do AdSense é exibido dentro da sala de aula (também evita problema de política com público escolar/menores).
- Chat sem upload de imagem para alunos anônimos, reduzindo risco de dado pessoal/imagem de menor.
- Seção nova na Política de Privacidade descrevendo o modo Sala de Aula, base legal (legítimo interesse educacional / responsabilidade da escola) e canal para solicitação de exclusão.

## Detalhes técnicos

**Banco (novas tabelas, com GRANT + RLS)**
- `classrooms`: id, teacher_id, name, subject, join_key (único, normalizado), is_open, created_at.
- `classroom_students`: id, classroom_id, display_name, session_token (uuid gerado no cliente), last_seen_at, joined_at.
- `classroom_materials`: id, classroom_id, type (`study` | `exercises`), title, content jsonb, is_live, created_at.
- `classroom_messages`: id, classroom_id, student_id (nulo se for o professor), teacher_id, message, created_at.
- `classroom_answers`: id, material_id, student_id, answers jsonb, score, created_at.
- `classroom_live_state`: classroom_id, material_id, section_index, updated_at.

**Acesso do aluno anônimo**
- Aluno não tem JWT, então todo acesso passa por funções `SECURITY DEFINER` validadas pelo par (`join_key`, `session_token`): `classroom_join`, `classroom_state`, `classroom_send_message`, `classroom_submit_answers`, `classroom_heartbeat`.
- RLS das tabelas: leitura/escrita direta apenas para o professor dono (`teacher_id = auth.uid()`); role `anon` não recebe SELECT direto em nenhuma tabela da sala.
- Rate limit por `session_token` em chat e respostas.

**Realtime**
- Realtime habilitado em `classroom_messages`, `classroom_live_state` e `classroom_students` para chat, sincronia da apresentação e lista de presentes.

**Frontend**
- `src/pages/Classroom.tsx` (painel do professor) e `src/pages/ClassroomJoin.tsx` (aluno), rotas `/classroom` e `/sala/:key` em `App.tsx`.
- Item "Sala de Aula" no `UserMenu.tsx` e nova aba "Salas de Aula" em `StudyGroups.tsx`.
- Hook `useClassroom` para estado, realtime e chamadas RPC.
- Traduções completas nos 9 idiomas (`pt-BR, en, es, fr, de, it, ja, zh, ru`) para todas as strings novas.
- Anúncios desativados nas rotas de sala de aula.
- Flag em `section_flags` (`classroom`) para o admin poder desativar a seção como nas demais.
