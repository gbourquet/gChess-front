/**
 * Matchmaking queue state
 */

export type QueueStatus = 'idle' | 'joining' | 'in_queue' | 'match_found' | 'error';

export interface QueueState {
  inQueue: boolean;
  position: number | null;
  status: QueueStatus;
  error?: string;
  timeControlLabel?: string; // e.g. "3+2"
}

/**
 * Initial queue state
 */
export const initialQueueState: QueueState = {
  inQueue: false,
  position: null,
  status: 'idle'
};
