// POST /ai/chat uses LegacyApiResponse<AIChatOutput> ({success,data,message}),
// confirmed against aiController.ts + ai/chat.ts's AIChatOutputSchema — a
// single whole JSON response, NOT streamed (confirmed: a plain res.json()
// call, no SSE/chunked-transfer anywhere in aiController.ts).
//
// /ai/history* uses a MIX of shapes within the same controller
// (ChatHistoryController.ts): saveChat/deleteChat return `{success,
// message}` with no `data` at all; getChatHistory returns `data` as a bare
// array (not `{items: [...]}`); getChat returns `data` as a single object.

export interface AIChatCourseContext {
  courseId?: string;
  courseTitle?: string;
  subjects?: Array<{ name: string; description?: string; modules?: unknown[] }>;
  program?: string;
  description?: string;
}

export interface AIChatSubjectContext {
  subjectName: string;
  subjectDescription?: string;
  modules?: unknown[];
}

export interface AIChatModuleContext {
  moduleName: string;
  moduleDescription?: string;
}

export interface AIChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AIChatRequest {
  message: string;
  courseContext?: AIChatCourseContext;
  subjectContext: AIChatSubjectContext;
  moduleContext: AIChatModuleContext;
  conversationHistory?: AIChatHistoryTurn[];
}

export interface AIChatOutput {
  response: string;
  suggestions?: string[];
}

// A single message as persisted in ChatHistory.messages[] — the exact shape
// isn't schema-constrained server-side (Mongoose stores whatever's sent),
// so this matches what the web app itself sends (see ai.ts's saveHistory).
export interface StoredChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
}

export interface SaveChatHistoryPayload {
  chatId: string;
  title: string;
  lastMessage: string;
  courseTitle?: string;
  courseId?: string;
  subjectName?: string;
  moduleName?: string;
  messages: StoredChatMessage[];
}

export interface ChatHistorySummary {
  chatId: string;
  title: string;
  lastMessage: string;
  courseTitle?: string;
  courseId?: string;
  subjectName?: string;
  moduleName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryDetail extends ChatHistorySummary {
  studentId: string;
  messages: StoredChatMessage[];
}
