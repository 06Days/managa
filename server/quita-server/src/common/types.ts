export type QuestionType = 'text' | 'number' | 'boolean' | 'scale';

export interface QuestionView {
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

export interface RelapseView {
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

export interface AddictionView {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  questions: QuestionView[];
  stats: AddictionStats;
  latestRelapse: RelapseView | null;
}

export interface AddictionRow {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionRow {
  id: number;
  addictionId: number;
  prompt: string;
  type: QuestionType;
  required: number;
  position: number;
}

export interface RelapseRow {
  id: number;
  addictionId: number;
  occurredAt: string;
  notes: string;
  answers: string;
  createdAt: string;
  updatedAt: string;
}
