export interface SurgeryMaterial {
  title: string;
  content: string;
  createdAt: string;
  slug: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  category: string;
}

export interface QuizResult {
  surgerySlug: string;
  surgeryTitle: string;
  score: number;
  total: number;
  date: string;
  questions: {
    question: string;
    correct: boolean;
    userAnswer: number;
    correctAnswer: number;
  }[];
}

export interface ProgressData {
  [surgerySlug: string]: {
    title: string;
    quizResults: QuizResult[];
    lastStudied: string;
  };
}
