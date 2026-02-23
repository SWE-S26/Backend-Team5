export const CHANNELS = {
  AUTH: 'auth',
  ORDER: 'order',
} as const;

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS];
