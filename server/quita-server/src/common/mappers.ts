import type {
  AddictionRow,
  AddictionView,
  QuestionRow,
  RelapseAnswer,
  RelapseRow,
  RelapseView,
} from './types';
import { buildStats } from './streak';

export function parseAnswers(raw: string): RelapseAnswer[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        questionId:
          typeof item.questionId === 'number' ? item.questionId : null,
        prompt: typeof item.prompt === 'string' ? item.prompt : 'Question',
        answer:
          typeof item.answer === 'string'
            ? item.answer
            : String(item.answer ?? ''),
      }));
  } catch {
    return [];
  }
}

export function toQuestionView(row: QuestionRow) {
  return {
    id: row.id,
    prompt: row.prompt,
    type: row.type,
    required: Boolean(row.required),
    position: row.position,
  };
}

export function toRelapseView(row: RelapseRow): RelapseView {
  return {
    id: row.id,
    addictionId: row.addictionId,
    occurredAt: row.occurredAt,
    notes: row.notes,
    answers: parseAnswers(row.answers),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAddictionView(
  row: AddictionRow,
  questions: QuestionRow[],
  relapses: RelapseRow[],
): AddictionView {
  const sorted = [...relapses].sort(
    (a, b) =>
      Date.parse(a.occurredAt) - Date.parse(b.occurredAt) || a.id - b.id,
  );
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    startedAt: row.startedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    questions: questions.map(toQuestionView),
    stats: buildStats(row, sorted),
    latestRelapse: sorted.length
      ? toRelapseView(sorted[sorted.length - 1])
      : null,
  };
}
