export interface ExerciseObjective {
  tipo: "objetiva";
  numero: number;
  nivel: string;
  enunciado: string;
  alternativas: string[];
  resposta: string;
  respostaCompleta: string;
  explicacao: string;
  dicaExtra?: string;
}

export interface ExerciseSubjective {
  tipo: "dissertativa";
  numero: number;
  nivel: string;
  enunciado: string;
  respostaEsperada: string;
  explicacao: string;
  criterios: string[];
}

export type Exercise = ExerciseObjective | ExerciseSubjective;

export interface ExerciseContent {
  titulo: string;
  descricao: string;
  exercicios: Exercise[];
  resumoTema: string;
}

export interface ExerciseFormData {
  tema: string;
  nivel: string;
  quantidade: number;
  dificuldade: string;
  imagemBase64?: string;
}
