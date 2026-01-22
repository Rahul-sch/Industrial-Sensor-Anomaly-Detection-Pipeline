// ============================================
// Ithena: The Blueprint - TypeScript Interfaces
// ============================================

// ===================
// Code X-Ray Types
// ===================

export interface XRayFile {
  filePath: string;
  fileHash: string;
  lastModified: string;
  language: 'python' | 'typescript' | 'javascript';
  entries: XRayEntry[];
}

export interface XRayEntry {
  id: string;
  title: string;
  startLine: number;
  endLine: number;
  anchors: Anchor[];
  why: string;
  whatItDoes: string;
  failureModes: FailureMode[];
  tests: TestSuggestion[];
  perfNotes: string | null;
  securityNotes: string | null;
  relatedDocs: string[];
  relatedNodes: string[];
}

export interface Anchor {
  kind: 'function' | 'class' | 'variable' | 'import' | 'decorator';
  value: string;
  line: number;
}

export interface FailureMode {
  condition: string;
  behavior: string;
  recovery: string;
}

export interface TestSuggestion {
  what: string;
  how: string;
}

export interface LineRange {
  start: number;
  end: number;
}

// ===================
// Wiki Types
// ===================

export interface WikiArticle {
  slug: string;
  title: string;
  category: WikiCategory;
  tags: string[];
  readingTime: number;
  prerequisites: string[];
  content?: string;
}

export type WikiCategory =
  | 'fundamentals'
  | 'kafka'
  | 'ml'
  | 'database'
  | 'security'
  | 'frontend';

export interface WikiIndex {
  categories: WikiCategoryGroup[];
}

export interface WikiCategoryGroup {
  id: WikiCategory;
  label: string;
  articles: { slug: string; title: string }[];
}

// ===================
// System Map Types
// ===================

export interface SystemTopology {
  nodes: MapNode[];
  edges: MapEdge[];
}

export interface MapNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  data: {
    facts: string[];
    wikiLinks: string[];
    xrayLinks: { file: string; entryId: string }[];
  };
}

export type NodeType =
  | 'sensor'
  | 'kafka'
  | 'consumer'
  | 'database'
  | 'dashboard'
  | 'twin';

export interface MapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated: boolean;
}

// ===================
// FAQ Types
// ===================

export interface FAQ {
  slug: string;
  question: string;
  tags: string[];
  priority: 'critical' | 'high' | 'medium';
  content?: string;
}

export interface FAQIndex {
  faqs: Omit<FAQ, 'content'>[];
}

// ===================
// Glossary Types
// ===================

export interface GlossaryEntry {
  term: string;
  definition: string;
  seeAlso: string[];
}

export interface Glossary {
  entries: GlossaryEntry[];
}

// ===================
// UI State Types
// ===================

export interface XRaySyncState {
  activeEntryId: string | null;
  highlightedLines: LineRange | null;
  scrollTarget: 'code' | 'commentary' | null;
  hoveredLine: number | null;
  setActiveEntry: (id: string | null) => void;
  setHighlightedLines: (range: LineRange | null) => void;
  setScrollTarget: (target: 'code' | 'commentary' | null) => void;
  setHoveredLine: (line: number | null) => void;
  reset: () => void;
}

// ===================
// Navigation Types
// ===================

export type LearningMode = 'wiki' | 'xray' | 'map' | 'faq';

export interface ModeConfig {
  id: LearningMode;
  label: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

export interface HighlightedLine {
  lineNumber: number;
  html: string;
  tokens: Array<{
    content: string;
    color?: string;
    fontStyle?: number;
  }>;
}

// ===================
// Study Mode Types
// ===================

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'critical';

export type AnnotationType = 'how' | 'why' | 'critical' | 'note' | 'warning';

export interface StudySession {
  id: string;
  startTime: string;
  endTime: string | null;
  mode: 'reading' | 'flashcards' | 'quiz';
  contentId: string;
  timeSpentSeconds: number;
  completed: boolean;
}

export interface UserProgress {
  // Core stats
  totalTimeSpentMinutes: number;
  streakDays: number;
  lastActiveDate: string;

  // Content progress
  articlesRead: string[];
  articlesInProgress: string[];

  // Flashcard progress
  flashcardsReviewed: number;
  flashcardsMastered: number;

  // Quiz progress
  quizzesCompleted: number;
  quizzesPassed: number;
  averageQuizScore: number;

  // Sessions
  sessions: StudySession[];

  // Achievements
  achievements: string[];
}

// ===================
// Flashcard Types
// ===================

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  category: WikiCategory | 'general';
  tags: string[];
  difficulty: Difficulty;
  relatedWiki?: string[];
  relatedXray?: { file: string; entryId: string }[];
}

export interface FlashCardProgress {
  cardId: string;
  reviewCount: number;
  correctCount: number;
  lastReview: string | null;
  nextReview: string;
  interval: number;       // Days until next review
  easeFactor: number;     // SM-2 ease factor (default 2.5)
  repetitions?: number;   // SM-2 repetition count
}

// ===================
// Quiz Types
// ===================

export type QuizQuestionType = 'multiple-choice' | 'true-false' | 'fill-blank';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuizQuestionType;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  category: WikiCategory | 'general';
  difficulty: Difficulty;
  relatedWiki?: string[];
  relatedFaq?: string[];
  relatedContent?: string[];
  tags?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: WikiCategory | 'general';
  difficulty: Difficulty;
  questions: string[];       // Question IDs
  timeLimit?: number;        // Minutes, optional
  passingScore: number;      // Percentage (0-100)
  estimatedMinutes?: number; // Estimated time to complete
}

export interface QuizAttempt {
  quizId: string;
  attemptId: string;
  startTime: string;
  endTime: string | null;
  answers: Record<string, string | number>;
  score: number | null;
  passed: boolean | null;
}

export interface QuizProgress {
  quizId: string;
  attempts: number;
  bestScore: number;
  lastAttempt: string | null;
  passed: boolean;
}

// ===================
// Achievement Types
// ===================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'streak' | 'articles' | 'quizzes' | 'flashcards' | 'time' | 'score';
    value: number;
  };
  unlockedAt?: string;
}

// ===================
// Study Annotation Types
// ===================

export type HighlightColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple';

export interface StudyHighlight {
  id: string;
  contentId: string;
  text: string;
  type: AnnotationType;
  color?: HighlightColor;
  position: {
    startOffset: number;
    endOffset: number;
  };
  note?: string;
  createdAt: string;
}

export interface StudyNote {
  id: string;
  contentId: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
