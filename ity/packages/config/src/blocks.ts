export const AVAILABLE_BLOCKS = {
  videos: {
    id: 'videos',
    name: 'Video Lessons',
    description: 'Pre-recorded video content',
    icon: 'play-circle',
    default: true,
  },
  live: {
    id: 'live',
    name: 'Live Classes',
    description: 'Real-time video sessions with students',
    icon: 'video',
    default: true,
  },
  quizzes: {
    id: 'quizzes',
    name: 'Quizzes',
    description: 'Test student knowledge with assessments',
    icon: 'check-square',
    default: true,
  },
  downloads: {
    id: 'downloads',
    name: 'Downloads',
    description: 'Downloadable files and resources',
    icon: 'download',
    default: true,
  },
  announcements: {
    id: 'announcements',
    name: 'Announcements',
    description: 'Send updates to enrolled students',
    icon: 'megaphone',
    default: true,
  },
  progress: {
    id: 'progress',
    name: 'Progress Tracking',
    description: 'Track student completion and engagement',
    icon: 'bar-chart',
    default: true,
  },
} as const;

export type BlockId = keyof typeof AVAILABLE_BLOCKS;
export type Block = (typeof AVAILABLE_BLOCKS)[BlockId];

export const DEFAULT_ACTIVE_BLOCKS: BlockId[] = Object.entries(AVAILABLE_BLOCKS)
  .filter(([, block]) => block.default)
  .map(([id]) => id as BlockId);
