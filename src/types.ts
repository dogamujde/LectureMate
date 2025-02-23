export interface Note {
  content: string;
  timestamp: string;
}

declare global {
  interface Window {
    config: {
      OPENAI_API_KEY: string;
      FIREBASE_API_KEY: string;
    };
  }
} 