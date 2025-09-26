export type LessonLite = {
  id: string;
  title: string;
  order: number;
};

export type ModuleNode = {
  id: string;
  title: string;
  parentId: string | null;
  children: ModuleNode[];
  lessons: LessonLite[];
};

export type SubjectDetail = {
  id: string;
  title: string;
  tree: ModuleNode[];
};