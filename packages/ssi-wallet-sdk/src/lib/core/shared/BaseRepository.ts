import { v4 as uuidv4 } from 'uuid';
import { IRepository, IDatabaseClient, ITableDefinition, QueryParam } from '../../types/index.js';

export abstract class BaseRepository<T extends { id: string }> implements IRepository<T> {
  constructor(
    protected readonly dbClient: IDatabaseClient,
    protected readonly tableDefinition: ITableDefinition<T>,
  ) {}

  async create(data: Omit<T, 'id'>): Promise<T> {
    const id = this.generateUUID();
    const entity: T = { ...data, id } as T;

    const columns = Object.keys(this.tableDefinition.schema) as (keyof T)[];
    const values = columns.map((col) => entity[col]) as QueryParam[];

    await this.dbClient.execute(
      `INSERT INTO ${this.tableDefinition.tableName} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      values,
    );

    return entity;
  }

  async find(where?: Partial<T>, limit?: number): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableDefinition.tableName}`;
    const params: QueryParam[] = [];

    if (where && Object.keys(where).length > 0) {
      const validatedWhere = this.validateWhereClause(where);
      const conditions = Object.keys(validatedWhere).map((key) => `${key} = ?`);
      query += ` WHERE ${conditions.join(' AND ')}`;
      params.push(...(Object.values(validatedWhere) as QueryParam[]));
    }

    if (limit) {
      const validatedLimit = this.validateLimit(limit);
      query += ` LIMIT ${validatedLimit}`;
    }

    const result = await this.dbClient.query<T>(query, params);
    return result.rows;
  }

  async findById(id: string): Promise<T | null> {
    this.validateId(id);

    const result = await this.dbClient.query<T>(
      `SELECT * FROM ${this.tableDefinition.tableName} WHERE id = ? LIMIT 1`,
      [id],
    );

    return result.rows[0] || null;
  }

  async update(id: string, updates: Partial<T>): Promise<void> {
    this.validateId(id);

    const validatedUpdates = this.validateUpdateFields(updates);
    const columns = Object.keys(validatedUpdates) as (keyof T)[];

    if (columns.length === 0) return;

    const setClause = columns.map((col) => `${String(col)} = ?`).join(', ');
    const values = columns.map((col) => validatedUpdates[col]) as QueryParam[];

    await this.dbClient.execute(
      `UPDATE ${this.tableDefinition.tableName} SET ${setClause} WHERE id = ?`,
      [...values, id],
    );
  }

  async delete(id: string): Promise<void> {
    this.validateId(id);

    await this.dbClient.execute(`DELETE FROM ${this.tableDefinition.tableName} WHERE id = ?`, [id]);
  }

  async count(where?: Partial<T>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableDefinition.tableName}`;
    const params: QueryParam[] = [];

    if (where && Object.keys(where).length > 0) {
      const validatedWhere = this.validateWhereClause(where);
      const conditions = Object.keys(validatedWhere).map((key) => `${key} = ?`);
      query += ` WHERE ${conditions.join(' AND ')}`;
      params.push(...(Object.values(validatedWhere) as QueryParam[]));
    }

    const result = await this.dbClient.query<{ count: number | string }>(query, params);
    return Number(result.rows[0].count);
  }

  protected generateUUID(): string {
    return uuidv4();
  }

  /**
   * Validates that all keys in the where clause exist in the table schema
   * @param where - The where clause object to validate
   * @returns Validated where clause with only valid columns
   * @throws Error if invalid columns are found
   */
  private validateWhereClause(where: Partial<T>): Partial<T> {
    const schemaKeys = new Set(Object.keys(this.tableDefinition.schema));
    const whereKeys = Object.keys(where);

    const invalidKeys = whereKeys.filter((key) => !schemaKeys.has(key));

    if (invalidKeys.length > 0) {
      throw new Error(
        `Invalid column(s) in where clause: ${invalidKeys.join(', ')}. ` +
          `Valid columns are: ${Array.from(schemaKeys).join(', ')}`,
      );
    }

    return where;
  }

  /**
   * Validates that all keys in the updates object exist in the table schema
   * @param updates - The updates object to validate
   * @returns Validated updates with only valid columns
   * @throws Error if invalid columns are found
   */
  private validateUpdateFields(updates: Partial<T>): Partial<T> {
    const schemaKeys = new Set(Object.keys(this.tableDefinition.schema));
    const updateKeys = Object.keys(updates);

    const invalidKeys = updateKeys.filter((key) => !schemaKeys.has(key));

    if (invalidKeys.length > 0) {
      throw new Error(
        `Invalid column(s) in update: ${invalidKeys.join(', ')}. ` +
          `Valid columns are: ${Array.from(schemaKeys).join(', ')}`,
      );
    }

    return updates;
  }

  /**
   * Validates that the ID is a non-empty string
   * @param id - The ID to validate
   * @throws Error if ID is invalid
   */
  private validateId(id: string): void {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('ID must be a non-empty string');
    }
  }

  /**
   * Validates that the limit is a positive integer
   * @param limit - The limit to validate
   * @returns Validated limit
   * @throws Error if limit is invalid
   */
  private validateLimit(limit: number): number {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('Limit must be a positive integer');
    }

    const MAX_LIMIT = 10000;
    if (limit > MAX_LIMIT) {
      throw new Error(`Limit cannot exceed ${MAX_LIMIT}`);
    }

    return limit;
  }
}
