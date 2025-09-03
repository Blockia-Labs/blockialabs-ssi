export type ActivityStatus = 'SUCCESS' | 'FAILED' | 'PENDING';
export type ActivityAction = string;

export interface Activity {
  id: string;
  timestamp: number;
  action: ActivityAction;
  status: ActivityStatus;
  details: Record<string, unknown>;
}
