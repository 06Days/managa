export type QuestionType = "text" | "number" | "boolean" | "scale";

export interface Question {
  id: number;
  prompt: string;
  type: QuestionType;
  required: boolean;
  position: number;
}

export interface RelapseAnswer {
  questionId: number | null;
  prompt: string;
  answer: string;
}

export interface Relapse {
  id: number;
  addictionId: number;
  occurredAt: string;
  notes: string;
  answers: RelapseAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface AddictionStats {
  currentStreakStartedAt: string;
  currentStreakMs: number;
  bestStreakMs: number;
  totalCleanMs: number;
  totalRelapses: number;
  lastRelapseAt: string | null;
}

export interface Addiction {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  stats: AddictionStats;
  latestRelapse: Relapse | null;
}

export interface QuestionInput {
  id?: number;
  prompt: string;
  type?: QuestionType;
  required?: boolean;
}

export interface AddictionInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  startedAt?: string;
  questions?: QuestionInput[];
}

export interface RelapseInput {
  occurredAt: string;
  notes?: string;
  answers?: { questionId?: number; answer: string }[];
}
