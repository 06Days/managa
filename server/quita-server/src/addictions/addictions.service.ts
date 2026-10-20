import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  AddictionRow,
  AddictionView,
  QuestionRow,
  RelapseRow,
} from '../common/types';
import { toAddictionView } from '../common/mappers';
import { normalizeIso } from '../common/dates';
import {
  ADDICTION_COLUMNS,
  QUESTION_COLUMNS,
  RELAPSE_COLUMNS,
} from '../common/columns';
import { CreateAddictionDto } from './dto/create-addiction.dto';
import { QuestionInputDto } from './dto/create-addiction.dto';
import { UpdateAddictionDto } from './dto/update-addiction.dto';

const DEFAULTS = {
  icon: '🌱',
  color: '#0d6efd',
  description: '',
};

@Injectable()
export class AddictionsService {
  constructor(private readonly database: DatabaseService) {}

  list(): AddictionView[] {
    const addictions = this.database.db
      .prepare(
        `SELECT ${ADDICTION_COLUMNS} FROM addictions ORDER BY lower(name), id`,
      )
      .all() as AddictionRow[];
    const questions = this.database.db
      .prepare(
        `SELECT ${QUESTION_COLUMNS} FROM questions ORDER BY position, id`,
      )
      .all() as QuestionRow[];
    const relapses = this.database.db
      .prepare(
        `SELECT ${RELAPSE_COLUMNS} FROM relapses ORDER BY occurred_at, id`,
      )
      .all() as RelapseRow[];

    const questionsByAddiction = groupBy(questions, (row) => row.addictionId);
    const relapsesByAddiction = groupBy(relapses, (row) => row.addictionId);

    return addictions.map((row) =>
      toAddictionView(
        row,
        questionsByAddiction.get(row.id) ?? [],
        relapsesByAddiction.get(row.id) ?? [],
      ),
    );
  }

  get(id: number): AddictionView {
    const row = this.findRow(id);
    return toAddictionView(row, this.questions(id), this.relapses(id));
  }

  create(dto: CreateAddictionDto): AddictionView {
    const now = new Date().toISOString();
    const startedAt = this.validStartedAt(dto.startedAt, now);
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('name cannot be blank');
    }

    const create = this.database.db.transaction(() => {
      const result = this.database.db
        .prepare(
          `INSERT INTO addictions
            (name, description, icon, color, started_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          name,
          (dto.description ?? DEFAULTS.description).trim(),
          (dto.icon ?? DEFAULTS.icon).trim() || DEFAULTS.icon,
          dto.color ?? DEFAULTS.color,
          startedAt,
          now,
          now,
        );

      const id = Number(result.lastInsertRowid);
      this.replaceQuestions(id, dto.questions ?? [], new Set());
      return id;
    });

    return this.get(create());
  }

  update(id: number, dto: UpdateAddictionDto): AddictionView {
    const existing = this.findRow(id);
    const now = new Date().toISOString();
    const startedAt =
      dto.startedAt === undefined
        ? existing.startedAt
        : this.validStartedAt(dto.startedAt, existing.startedAt);
    const nextName = dto.name == null ? existing.name : dto.name.trim();
    if (!nextName) {
      throw new BadRequestException('name cannot be blank');
    }

    const latest = this.database.db
      .prepare(
        'SELECT occurred_at AS occurredAt FROM relapses WHERE addiction_id = ? ORDER BY occurred_at DESC LIMIT 1',
      )
      .get(id) as { occurredAt: string } | undefined;
    if (latest && Date.parse(startedAt) > Date.parse(latest.occurredAt)) {
      throw new BadRequestException(
        'startedAt cannot be later than an existing relapse',
      );
    }

    const update = this.database.db.transaction(() => {
      this.database.db
        .prepare(
          `UPDATE addictions
           SET name = ?, description = ?, icon = ?, color = ?, started_at = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(
          nextName,
          dto.description == null
            ? existing.description
            : dto.description.trim(),
          dto.icon == null ? existing.icon : dto.icon.trim() || DEFAULTS.icon,
          dto.color ?? existing.color,
          startedAt,
          now,
          id,
        );

      if (dto.questions != null) {
        const existingQuestions = new Set(
          this.questions(id).map((question) => question.id),
        );
        this.replaceQuestions(id, dto.questions, existingQuestions);
      }
    });

    update();
    return this.get(id);
  }

  remove(id: number): void {
    const result = this.database.db
      .prepare('DELETE FROM addictions WHERE id = ?')
      .run(id);
    if (result.changes === 0) {
      throw new NotFoundException(`Addiction ${id} not found`);
    }
  }

  findRow(id: number): AddictionRow {
    const row = this.database.db
      .prepare(`SELECT ${ADDICTION_COLUMNS} FROM addictions WHERE id = ?`)
      .get(id) as AddictionRow | undefined;
    if (!row) {
      throw new NotFoundException(`Addiction ${id} not found`);
    }
    return row;
  }

  questions(id: number): QuestionRow[] {
    return this.database.db
      .prepare(
        `SELECT ${QUESTION_COLUMNS} FROM questions WHERE addiction_id = ? ORDER BY position, id`,
      )
      .all(id) as QuestionRow[];
  }

  relapses(id: number): RelapseRow[] {
    return this.database.db
      .prepare(
        `SELECT ${RELAPSE_COLUMNS} FROM relapses WHERE addiction_id = ? ORDER BY occurred_at, id`,
      )
      .all(id) as RelapseRow[];
  }

  private validStartedAt(value: string | undefined, fallback: string): string {
    if (value === undefined) return fallback;
    try {
      const iso = normalizeIso(value, 'startedAt');
      if (Date.parse(iso) > Date.now() + 5 * 60 * 1000) {
        throw new BadRequestException('startedAt cannot be in the future');
      }
      return iso;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('startedAt must be a valid date');
    }
  }

  private replaceQuestions(
    addictionId: number,
    inputs: QuestionInputDto[],
    existingIds: Set<number>,
  ) {
    const kept = new Set<number>();

    inputs.forEach((input, index) => {
      const prompt = input.prompt.trim();
      if (!prompt) return;

      const type = input.type ?? 'text';
      const required = input.required ? 1 : 0;

      if (input.id !== undefined) {
        if (!existingIds.has(input.id)) {
          throw new BadRequestException(
            `Question ${input.id} does not belong to addiction ${addictionId}`,
          );
        }
        this.database.db
          .prepare(
            `UPDATE questions
             SET prompt = ?, type = ?, required = ?, position = ?
             WHERE id = ? AND addiction_id = ?`,
          )
          .run(prompt, type, required, index, input.id, addictionId);
        kept.add(input.id);
        return;
      }

      const result = this.database.db
        .prepare(
          `INSERT INTO questions
            (addiction_id, prompt, type, required, position)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(addictionId, prompt, type, required, index);
      kept.add(Number(result.lastInsertRowid));
    });

    for (const id of existingIds) {
      if (!kept.has(id)) {
        this.database.db
          .prepare('DELETE FROM questions WHERE id = ? AND addiction_id = ?')
          .run(id, addictionId);
      }
    }
  }
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const value = key(item);
    const list = map.get(value);
    if (list) list.push(item);
    else map.set(value, [item]);
  }
  return map;
}
