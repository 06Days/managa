/**
 * SQLite stores snake_case columns, while the API and services use camelCase.
 * Keep the aliases in one place so every SELECT returns the same shape.
 */
export const ADDICTION_COLUMNS = `
  id, name, description, icon, color,
  started_at AS startedAt,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

export const QUESTION_COLUMNS = `
  id,
  addiction_id AS addictionId,
  prompt, type, required, position
`;

export const RELAPSE_COLUMNS = `
  id,
  addiction_id AS addictionId,
  occurred_at AS occurredAt,
  notes, answers,
  created_at AS createdAt,
  updated_at AS updatedAt
`;
