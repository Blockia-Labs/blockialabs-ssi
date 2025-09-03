import { Activity, IDatabaseClient } from '../../types/index.js';
import { BaseRepository } from '../shared/BaseRepository.js';

export class ActivityRepository extends BaseRepository<Activity> {
  constructor(dbClient: IDatabaseClient) {
    super(dbClient, {
      tableName: 'activities',
      schema: {
        id: { type: 'string', primaryKey: true },
        timestamp: { type: 'number', required: true },
        action: { type: 'string', required: true },
        status: { type: 'string', required: true },
        details: { type: 'json', required: true },
      },
      indexes: [
        {
          name: 'idx_activities_action_status',
          columns: ['action', 'status'],
        },
        {
          name: 'idx_activities_timestamp',
          columns: ['timestamp'],
        },
      ],
    });
  }

  async getRecentActivities(limit = 100): Promise<Activity[]> {
    return this.dbClient
      .query<Activity>(
        `SELECT * FROM ${this.tableDefinition.tableName} ORDER BY timestamp DESC LIMIT ?`,
        [limit],
      )
      .then((result) => result.rows);
  }
}
