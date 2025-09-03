import { Activity } from '../../types/index.js';
import { ActivityRepository } from './ActivityRepository.js';

export class ActivityManager {
  constructor(private activityRepository: ActivityRepository) {}

  async createActivity(activityData: Omit<Activity, 'id'>): Promise<Activity> {
    return this.activityRepository.create(activityData);
  }

  async getActivityById(id: string): Promise<Activity | null> {
    return this.activityRepository.findById(id);
  }

  async getRecentActivities(limit = 100): Promise<Activity[]> {
    return this.activityRepository.getRecentActivities(limit);
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
    return this.activityRepository.update(id, updates);
  }

  async deleteActivity(id: string): Promise<void> {
    return this.activityRepository.delete(id);
  }

  async countActivities(where?: Partial<Activity>): Promise<number> {
    return this.activityRepository.count(where);
  }
}
