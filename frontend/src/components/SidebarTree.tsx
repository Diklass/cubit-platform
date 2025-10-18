// src/components/SidebarTree.tsx
import React from "react";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  LinearProgress,
  Stack,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { calcModuleProgress } from "../utils/progress";
import { useNavigate } from "react-router-dom";

type LessonLite = { id: string; title: string; order: number };

export type ModuleNode = {
  id: string;
  title: string;
  parentId: string | null;
  children: ModuleNode[];
  lessons: LessonLite[];
};

interface Props {
  tree: ModuleNode[];
  onSelectLesson: (lessonId: string) => void;
  selectedLessonId?: string;
  onAddLesson?: (moduleId: string) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onDeleteModule?: (moduleId: string) => void;
  currentRole: "ADMIN" | "TEACHER" | "STUDENT" | "GUEST";
}

export const SidebarTree: React.FC<Props> = ({
  tree,
  onSelectLesson,
  selectedLessonId,
  onAddLesson,
  onDeleteLesson,
  onDeleteModule,
  currentRole,
}) => {
  const navigate = useNavigate();
  const isReadonly = currentRole === "STUDENT" || currentRole === "GUEST";

  const renderNode = (node: ModuleNode) => (
    <TreeItem
      key={node.id}
      itemId={node.id}
      label={
        <Stack spacing={0.5}>
          {/* Заголовок модуля */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {node.title}
            </Typography>

            {!isReadonly && (
              <Button
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Удалить модуль "${node.title}"?`)) {
                    onDeleteModule?.(node.id);
                  }
                }}
              >
                🗑
              </Button>
            )}
          </Stack>

          {/* Прогресс */}
          <LinearProgress
            variant="determinate"
            value={calcModuleProgress(node)}
            sx={{ height: 6, borderRadius: 1, opacity: 0.9 }}
          />

          {/* Добавить урок — только для учителей */}
          {!isReadonly && onAddLesson && (
            <Box sx={{ mt: 0.5 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddLesson(node.id);
                }}
              >
                + Урок
              </Button>
            </Box>
          )}
        </Stack>
      }
    >
      {/* Список уроков */}
      {node.lessons.map((l) => (
        <TreeItem
          key={l.id}
          itemId={l.id}
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: l.id === selectedLessonId ? 700 : 400,
                }}
              >
                {l.title}
              </Typography>

              {!isReadonly && (
                <>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/lessons/edit/${l.id}`);
                    }}
                  >
                    ✎
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Удалить урок "${l.title}"?`)) {
                        onDeleteLesson?.(l.id);
                      }
                    }}
                  >
                    🗑
                  </Button>
                </>
              )}
            </Stack>
          }
          onClick={() => onSelectLesson(l.id)}
        />
      ))}

      {/* Дочерние модули */}
      {node.children.map((c) => renderNode(c))}
    </TreeItem>
  );

  return (
    <SimpleTreeView
      slots={{
        collapseIcon: ExpandMoreIcon,
        expandIcon: ChevronRightIcon,
      }}
      sx={{ flexGrow: 1, overflowY: "auto", maxHeight: "80vh", p: 1 }}
    >
      {tree.map((n) => renderNode(n))}
    </SimpleTreeView>
  );
};
