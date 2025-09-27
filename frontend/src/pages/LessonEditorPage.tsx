import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  TextField,
  Paper,
  IconButton,
  Stack,
  Snackbar,
  MenuItem,
  Select,
} from '@mui/material';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

type Block = { type: string; content: string };
type Lesson = { id: string; title: string; content: string | null };

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (opts: { listeners: any }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ listeners })}
    </div>
  );
}

export default function LessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState(false);

  const [deletedBlock, setDeletedBlock] = useState<Block | null>(null);
  const [deletedIndex, setDeletedIndex] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Lesson>(`/subjects/lessons/${id}`)
      .then((r) => {
        setLesson(r.data);
        setTitle(r.data.title);
        setBlocks(r.data.content ? JSON.parse(r.data.content) : []);
      })
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddBlock = (type: string) => {
    setBlocks([...blocks, { type, content: '' }]);
  };

  const handleDeleteBlock = (idx: number) => {
    if (confirm('Удалить этот блок?')) {
      setDeletedBlock(blocks[idx]);
      setDeletedIndex(idx);
      setBlocks(blocks.filter((_, i) => i !== idx));
      setSnackbarOpen(true);
    }
  };

  const handleUndoDelete = () => {
    if (deletedBlock !== null && deletedIndex !== null) {
      const copy = [...blocks];
      copy.splice(deletedIndex, 0, deletedBlock);
      setBlocks(copy);
    }
    setDeletedBlock(null);
    setDeletedIndex(null);
    setSnackbarOpen(false);
  };

  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    setBlocks(arrayMove(blocks, from, to));
  };

  const handleSave = async () => {
    if (!id) return;
    await api.patch(`/subjects/lessons/${id}`, {
      title,
      content: JSON.stringify(blocks),
    });
    navigate(-1);
  };

  const handleDragEnd = ({ active, over }: any) => {
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id, 10);
      const newIndex = parseInt(over.id, 10);
      setBlocks((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lesson) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">
          Урок не найден
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 3, pb: 12, px: 2 }}>
      {/* Название урока */}
      <TextField
        label="Название урока"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      {/* Контент */}
      {preview ? (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {blocks.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Нет содержимого
            </Typography>
          )}
          {blocks.map((b, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              {b.type === 'text' && <Typography>{b.content}</Typography>}
              {b.type === 'image' && <Typography>[Изображение]</Typography>}
              {b.type === 'video' && <Typography>Видео: {b.content}</Typography>}
              {b.type === 'file' && <Typography>Файл прикреплён</Typography>}
            </Box>
          ))}
        </Box>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={blocks.map((_, idx) => idx.toString())}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence>
              {blocks.map((b, idx) => (
                <SortableItem key={idx.toString()} id={idx.toString()}>
                  {({ listeners }) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Box
                        sx={(theme) => ({
                          mb: 2,
                          p: 2,
                          border: '1px solid',
                          borderColor: theme.palette.divider,
                          borderRadius: 2,
                          backgroundColor: theme.palette.background.paper,
                        })}
                      >
                        <Stack direction="row" alignItems="flex-start" spacing={2}>
                          <Box sx={{ flex: 1 }}>
                            {/* Select для типа блока */}
                            <Select
                              size="small"
                              value={b.type}
                              onChange={(e) => {
                                const copy = [...blocks];
                                copy[idx].type = e.target.value;
                                setBlocks(copy);
                              }}
                              sx={{ mb: 1 }}
                            >
                              <MenuItem value="text">Текст</MenuItem>
                              <MenuItem value="image">Изображение</MenuItem>
                              <MenuItem value="video">Видео</MenuItem>
                              <MenuItem value="file">Файл</MenuItem>
                            </Select>

                            {b.type === 'text' && (
                              <TextField
                                fullWidth
                                multiline
                                placeholder="Введите текст..."
                                value={b.content}
                                onChange={(e) => {
                                  const copy = [...blocks];
                                  copy[idx].content = e.target.value;
                                  setBlocks(copy);
                                }}
                              />
                            )}
                            {b.type === 'image' && (
                              <Button variant="outlined">Загрузить изображение</Button>
                            )}
                            {b.type === 'video' && (
                              <TextField
                                fullWidth
                                placeholder="Вставьте ссылку на видео"
                                value={b.content}
                                onChange={(e) => {
                                  const copy = [...blocks];
                                  copy[idx].content = e.target.value;
                                  setBlocks(copy);
                                }}
                              />
                            )}
                            {b.type === 'file' && <Button variant="outlined">Прикрепить файл</Button>}
                          </Box>

                          {/* справа иконки */}
                          <Stack direction="column" spacing={1}>
                            <IconButton {...listeners} size="small">
                              <DragIndicatorIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => moveBlock(idx, idx - 1)}>
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => moveBlock(idx, idx + 1)}>
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteBlock(idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Box>
                    </motion.div>
                  )}
                </SortableItem>
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      )}

      {/* Нижняя панель */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '95%',
          maxWidth: 800,
          borderRadius: 4,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Button onClick={() => setPreview(!preview)}>
          {preview ? 'Редактировать' : 'Предпросмотр'}
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Сохранить
          </Button>
        </Box>
      </Paper>

      {/* FAB */}
      {!preview && (
        <Box sx={{ position: 'fixed', bottom: 90, right: 24 }}>
          <SpeedDial ariaLabel="Добавить блок" icon={<SpeedDialIcon />}>
            <SpeedDialAction
              icon={<TextFieldsIcon />}
              tooltipTitle="Текст"
              onClick={() => handleAddBlock('text')}
            />
            <SpeedDialAction
              icon={<ImageIcon />}
              tooltipTitle="Изображение"
              onClick={() => handleAddBlock('image')}
            />
            <SpeedDialAction
              icon={<MovieIcon />}
              tooltipTitle="Видео"
              onClick={() => handleAddBlock('video')}
            />
            <SpeedDialAction
              icon={<AttachFileIcon />}
              tooltipTitle="Файл"
              onClick={() => handleAddBlock('file')}
            />
          </SpeedDial>
        </Box>
      )}

      {/* Snackbar для отмены */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message="Блок удалён"
        action={
          <Button color="secondary" size="small" onClick={handleUndoDelete}>
            Отменить
          </Button>
        }
      />
    </Box>
  );
}
