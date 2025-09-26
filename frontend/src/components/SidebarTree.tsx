import React from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { LinearProgress, Stack, Typography, Button, Box } from '@mui/material';
import { calcModuleProgress } from '../utils/progress';

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
  onAddLesson?: (moduleId: string) => void; // 👈 добавили коллбек
}

export const SidebarTree: React.FC<Props> = ({
  tree,
  onSelectLesson,
  selectedLessonId,
  onAddLesson,
}) => {
  const renderNode = (node: ModuleNode) => (
    <TreeItem
      key={node.id}
      itemId={node.id}
      // Лейбл теперь у модуля
      label={
        <Stack spacing={0.5}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {node.title}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={calcModuleProgress(node)}
            sx={{ height: 6, borderRadius: 1, opacity: 0.9 }}
          />
          {onAddLesson && (
            <Box sx={{ mt: 0.5 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation(); // чтобы не сворачивалось дерево
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
      {node.lessons.map((l) => (
        <TreeItem
          key={l.id}
          itemId={l.id}
          label={
            <Typography
              variant="body2"
              sx={{
                fontWeight: l.id === selectedLessonId ? 700 : 400,
              }}
            >
              {l.title}
            </Typography>
          }
          onClick={() => onSelectLesson(l.id)}
        />
      ))}
      {node.children.map((c) => renderNode(c))}
    </TreeItem>
  );

  return (
    <SimpleTreeView
      slots={{
        collapseIcon: ExpandMoreIcon,
        expandIcon: ChevronRightIcon,
      }}
      sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '80vh', p: 1 }}
    >
      {tree.map((n) => renderNode(n))}
    </SimpleTreeView>
  );
};
