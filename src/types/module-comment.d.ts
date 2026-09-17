// GET/POST /courses/:courseId/subject/:subjectName/module/:moduleNumber/comments
// — shape confirmed directly against commentController.ts /
// shared/models/Comment.model.ts, not assumed from mobile's own (partial)
// ApiComment type.
export interface ModuleComment {
  _id: string;
  authorName: string;
  authorRole: "Student" | "Teacher";
  text: string;
  createdAt: string;
}

export interface ListModuleCommentsResult {
  comments: ModuleComment[];
  nextCursor: string | null;
}

export interface ToggleModuleLikeResult {
  likes: number;
  liked: boolean;
}
