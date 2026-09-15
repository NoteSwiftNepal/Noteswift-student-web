// GET /courses/:courseId/mindmap/:subjectName(?moduleNumber=N) —
// LegacyApiResponse<Mindmap | null>. Confirmed against
// studentMindmapController.ts / shared/models/Mindmap.model.ts. Omitting
// moduleNumber returns the subject-level "master" mindmap; passing it scopes
// to that one module's mindmap — same endpoint for both (mobile's own
// SubjectMindmapViewer is reused for both the subject and module tabs the
// same way).
export interface MindmapNode {
  id: string;
  parentId: string | null;
  title: string;
  type?: string;
  link?: string;
  color?: string;
}

export interface Mindmap {
  _id: string;
  title: string;
  description?: string;
  nodes: MindmapNode[];
}
