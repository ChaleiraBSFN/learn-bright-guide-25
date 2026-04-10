export interface StudyContent {
  objetivo: {
    titulo: string;
    conteudo: string;
  };
  resumo: {
    titulo: string;
    conteudo: string;
  };
  demonstracoes: {
    titulo: string;
    passos: Array<{
      numero: number;
      titulo: string;
      conceito: string;
      exemplo: string;
      dicaImportante?: string;
    }>;
  };
  exercicios: {
    titulo: string;
    lista: Array<{
      nivel: string;
      pergunta: string;
      resposta: string;
      explicacao: string;
    }>;
  };
  errosComuns: {
    titulo: string;
    lista: Array<{
      erro: string;
      comoEvitar: string;
    }>;
  };
  mapaVisual: {
    titulo: string;
    temaCentral: string;
    ramos: Array<{
      nome: string;
      icone: string;
      cor: string;
      subitens: string[];
    }>;
  };
  planoEstudo?: {
    titulo: string;
    blocos: Array<{
      numero: number;
      periodo: string;
      objetivo: string;
      tarefas: string[];
      evidencia: string;
    }>;
  };
  fontes: {
    titulo: string;
    consultas: string[];
    sites: Array<{
      nome: string;
      url?: string;
      termoBusca?: string;
      descricao: string;
    }>;
  };
  // Premium fields
  videosRecomendados?: {
    titulo: string;
    lista: Array<{
      titulo: string;
      canal: string;
      descricao: string;
      termoBusca: string;
    }>;
  };
  imagensIlustrativas?: {
    titulo: string;
    lista: Array<{
      descricao: string;
      imagemBase64?: string;
    }>;
  };
  analiseImagem?: {
    titulo: string;
    descricao: string;
    exerciciosIdentificados?: Array<{
      numero: number;
      enunciado: string;
      resolucao: string;
      explicacao: string;
    }>;
    conceitosExtraidos?: string[];
    observacoes?: string;
  };
}

export interface StudyFormData {
  tema: string;
  nivel: string;
  prazo: number;
  duvidas: string;
  isPremium?: boolean;
  imagemBase64?: string;
}
