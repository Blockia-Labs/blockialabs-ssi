import { Activity, ActivityStatus } from '../types/index.js';
import { ActivityManager } from '../core/activities/ActivityManager.js';
import { ActivityRepository } from '../core/activities/ActivityRepository.js';

describe('ActivityManager', () => {
  let activityManager: ActivityManager;
  let mockActivityRepository: jest.Mocked<ActivityRepository>;

  beforeEach(() => {
    mockActivityRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
      getRecentActivities: jest.fn(),
    } as unknown as jest.Mocked<ActivityRepository>;

    activityManager = new ActivityManager(mockActivityRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createActivity', () => {
    it('should create an activity', async () => {
      const activityData: Omit<Activity, 'id'> = {
        timestamp: Date.now(),
        action: 'credential_issue',
        status: 'SUCCESS' as ActivityStatus,
        details: { credentialId: 'cred123' },
      };

      const mockActivity: Activity = {
        id: 'act123',
        ...activityData,
      };

      mockActivityRepository.create.mockResolvedValue(mockActivity);

      const result = await activityManager.createActivity(activityData);

      expect(mockActivityRepository.create).toHaveBeenCalledWith(activityData);
      expect(result).toEqual(mockActivity);
    });
  });

  describe('getRecentActivities', () => {
    it('should retrieve recent activities', async () => {
      const mockActivities: Activity[] = [
        {
          id: 'act1',
          timestamp: Date.now() - 1000,
          action: 'credential_issue',
          status: 'SUCCESS' as ActivityStatus,
          details: {},
        },
        {
          id: 'act2',
          timestamp: Date.now(),
          action: 'credential_verify',
          status: 'SUCCESS' as ActivityStatus,
          details: {},
        },
      ];

      mockActivityRepository.getRecentActivities.mockResolvedValue(mockActivities);

      const result = await activityManager.getRecentActivities();

      expect(mockActivityRepository.getRecentActivities).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockActivities);
    });

    it('should respect custom limit', async () => {
      mockActivityRepository.getRecentActivities.mockResolvedValue([]);

      await activityManager.getRecentActivities(5);

      expect(mockActivityRepository.getRecentActivities).toHaveBeenCalledWith(5);
    });
  });

  describe('countActivities', () => {
    it('should count activities with optional filters', async () => {
      mockActivityRepository.count.mockResolvedValue(3);

      const result = await activityManager.countActivities({ status: 'SUCCESS' });

      expect(mockActivityRepository.count).toHaveBeenCalledWith({ status: 'SUCCESS' });
      expect(result).toBe(3);
    });

    it('should count all activities when no filter provided', async () => {
      mockActivityRepository.count.mockResolvedValue(5);

      const result = await activityManager.countActivities();

      expect(mockActivityRepository.count).toHaveBeenCalledWith(undefined);
      expect(result).toBe(5);
    });
  });

  describe('updateActivity', () => {
    it('should update an activity', async () => {
      const updates: Partial<Activity> = {
        status: 'FAILED' as ActivityStatus,
        details: { error: 'Invalid signature' },
      };

      mockActivityRepository.update.mockResolvedValue(undefined);

      await activityManager.updateActivity('act123', updates);

      expect(mockActivityRepository.update).toHaveBeenCalledWith('act123', updates);
    });
  });
});
