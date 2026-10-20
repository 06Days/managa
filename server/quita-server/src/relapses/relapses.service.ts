import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AddictionsService } from '../addictions/addictions.service';
import { RelapseRow, RelapseView } from '../common/types';
import { toRelapseView, parseAnswers } from '../common/mappers';
import { normalizeIso } from '../common/dates';
import { RELAPSE_COLUMNS } from '../common/columns';
import { CreateRelapseDto, RelapseAnswerDto } from './dto/create-relapse.dto';
import { UpdateRelapseDto } from './dto/update-relapse.dto';

@Injectable()
export class RelapsesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly addictions: AddictionsService,
  ) {}

  list(addictionId: number): RelapseView[] {
    this.addictions.findRow(addictionId);
    return this.rows(addictionId).map(toRelapseView);
  }

  get(addictionId: number, relapseId: number): RelapseView {
    this.addictions.findRow(addictionId);
    return toRelapseView(this.findRow(addictionId, relapseId));
  }

  create(addictionId: number, dto: CreateRelapseDto): RelapseView {
    const addiction = this.addictions.findRow(addictionId);
    const occurredAt = this.validOccurredAt(
      dto.occurredAt,
      addiction.startedAt,
    );
    const answers = this.buildAnswers(addictionId, dto.answers ?? []);
    const now = new Date().toISOString();

    const result = this.database.db
      .prepare(
        `INSERT INTO relapses
          (addiction_id, occurred_at, notes, answers, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        addictionId,
        occurredAt,
        (dto.notes ?? '').trim(),
        JSON.stringify(answers),
        now,
        now,
      );

    return this.get(addictionId, Number(result.lastInsertRowid));
  }

  update(
    addictionId: number,
    relapseId: number,
    dto: UpdateRelapseDto,
  ): RelapseView {
    const addiction = this.addictions.findRow(addictionId);
    const existing = this.findRow(addictionId, relapseId);
    const occurredAt =
      dto.occurredAt === undefined
        ? existing.occurredAt
        : this.validOccurredAt(dto.occurredAt, addiction.startedAt);
    const answers =
      dto.answers == null
        ? existing.answers
        : JSON.stringify(
            this.mergeAnswers(addictionId, existing.answers, dto.answers),
          );
    const now = new Date().toISOString();

    this.database.db
      .prepare(
        `UPDATE relapses
         SET occurred_at = ?, notes = ?, answers = ?, updated_at = ?
         WHERE id = ? AND addiction_id = ?`,
      )
      .run(
        occurredAt,
        dto.notes == null ? existing.notes : dto.notes.trim(),
        answers,
        now,
        relapseId,
        addictionId,
      );

    return this.get(addictionId, relapseId);
  }

  remove(addictionId: number, relapseId: number): void {
    this.addictions.findRow(addictionId);
    const result = this.database.db
      .prepare('DELETE FROM relapses WHERE id = ? AND addiction_id = ?')
      .run(relapseId, addictionId);
    if (result.changes === 0) {
      throw new NotFoundException(`Relapse ${relapseId} not found`);
    }
  }

  private rows(addictionId: number): RelapseRow[] {
    return this.database.db
      .prepare(
        `SELECT ${RELAPSE_COLUMNS} FROM relapses WHERE addiction_id = ? ORDER BY occurred_at, id`,
      )
      .all(addictionId) as RelapseRow[];
  }

  private findRow(addictionId: number, relapseId: number): RelapseRow {
    const row = this.database.db
      .prepare(
        `SELECT ${RELAPSE_COLUMNS} FROM relapses WHERE id = ? AND addiction_id = ?`,
      )
      .get(relapseId, addictionId) as RelapseRow | undefined;
    if (!row) {
      throw new NotFoundException(`Relapse ${relapseId} not found`);
    }
    return row;
  }

  private validOccurredAt(value: string, startedAt: string): string {
    let iso: string;
    try {
      iso = normalizeIso(value, 'occurredAt');
    } catch {
      throw new BadRequestException('occurredAt must be a valid date');
    }

    if (Date.parse(iso) > Date.now() + 5 * 60 * 1000) {
      throw new BadRequestException('A relapse cannot be in the future');
    }
    if (Date.parse(iso) < Date.parse(startedAt)) {
      throw new BadRequestException(
        'A relapse cannot be earlier than the addiction start date',
      );
    }
    return iso;
  }

  /**
   * Replacing a relapse's answers should not erase snapshots for questions
   * that have since been deleted from the addiction.
   */
  private mergeAnswers(
    addictionId: number,
    existingAnswers: string,
    inputs: RelapseAnswerDto[],
  ): { questionId: number | null; prompt: string; answer: string }[] {
    const currentQuestionIds = new Set(
      this.addictions.questions(addictionId).map((question) => question.id),
    );
    const historical = parseAnswers(existingAnswers).filter(
      (answer) =>
        answer.questionId === null ||
        !currentQuestionIds.has(answer.questionId),
    );
    return [...historical, ...this.buildAnswers(addictionId, inputs)];
  }

  private buildAnswers(
    addictionId: number,
    inputs: RelapseAnswerDto[],
  ): { questionId: number | null; prompt: string; answer: string }[] {
    const questions = this.addictions.questions(addictionId);
    const byId = new Map(questions.map((question) => [question.id, question]));
    const answers = new Map<number, { prompt: string; answer: string }>();

    for (const input of inputs) {
      const answer = input.answer.trim();
      if (!answer) continue;

      if (input.questionId !== undefined) {
        const question = byId.get(input.questionId);
        if (!question) {
          throw new BadRequestException(
            `Question ${input.questionId} does not belong to this addiction`,
          );
        }
        answers.set(question.id, { prompt: question.prompt, answer });
      }
    }

    for (const question of questions) {
      if (question.required && !answers.has(question.id)) {
        throw new BadRequestException(
          `"${question.prompt}" is required before logging a relapse`,
        );
      }
    }

    return [...answers.entries()].map(([questionId, value]) => ({
      questionId,
      prompt: value.prompt,
      answer: value.answer,
    }));
  }
}
