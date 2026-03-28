export interface TimeControlPreset {
  label: string;
  totalTimeMinutes: number;
  incrementSeconds: number;
  category: 'bullet' | 'blitz' | 'rapid' | 'classical';
}

export const TIME_CONTROL_PRESETS: TimeControlPreset[] = [
  // Bullet
  { label: '1+0',  totalTimeMinutes: 1,  incrementSeconds: 0,  category: 'bullet' },
  { label: '2+0',  totalTimeMinutes: 2,  incrementSeconds: 0,  category: 'bullet' },
  { label: '2+1',  totalTimeMinutes: 2,  incrementSeconds: 1,  category: 'bullet' },
  // Blitz
  { label: '3+0',  totalTimeMinutes: 3,  incrementSeconds: 0,  category: 'blitz' },
  { label: '3+2',  totalTimeMinutes: 3,  incrementSeconds: 2,  category: 'blitz' },
  { label: '5+0',  totalTimeMinutes: 5,  incrementSeconds: 0,  category: 'blitz' },
  { label: '5+3',  totalTimeMinutes: 5,  incrementSeconds: 3,  category: 'blitz' },
  // Rapid
  { label: '10+0', totalTimeMinutes: 10, incrementSeconds: 0,  category: 'rapid' },
  { label: '10+5', totalTimeMinutes: 10, incrementSeconds: 5,  category: 'rapid' },
  { label: '15+10',totalTimeMinutes: 15, incrementSeconds: 10, category: 'rapid' },
  // Classical
  { label: '30+0', totalTimeMinutes: 30, incrementSeconds: 0,  category: 'classical' },
  { label: '30+20',totalTimeMinutes: 30, incrementSeconds: 20, category: 'classical' },
];

export const CATEGORY_LABELS: Record<TimeControlPreset['category'], string> = {
  bullet: '⚡ Bullet',
  blitz: '🔥 Blitz',
  rapid: '⏱ Rapide',
  classical: '♟ Classique',
};

export interface TimeControlSelection {
  totalTimeMinutes: number;
  incrementSeconds: number;
}
