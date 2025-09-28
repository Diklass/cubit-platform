// src/pages/LessonEditorPage.tsx
import React, { useEffect, useState, useRef } from 'react';
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
  Menu,
} from '@mui/material';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';

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

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState(false);

  const [deletedBlock, setDeletedBlock] = useState<Block | null>(null);
  const [deletedIndex, setDeletedIndex] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

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

  // ➕ добавить блок
  const handleAddBlock = (type: string) => {
    setBlocks((prev) => [...prev, { type, content: '' }]);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    setMenuAnchor(null); // закрываем меню
  };

  // 🗑 удалить блок
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

  // 🔼🔽 переместить блок
  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    setBlocks(arrayMove(blocks, from, to));
  };

  // 💾 сохранить урок
  const handleSave = async () => {
    if (!id) return;
    await api.patch(`/subjects/lessons/${id}`, {
      title,
      content: JSON.stringify(blocks),
    });
    navigate(-1);
  };

  // 🖱 drag'n'drop
  const handleDragEnd = ({ active, over }: any) => {
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id, 10);
      const newIndex = parseInt(over.id, 10);
      setBlocks((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  // 📤 загрузка файлов
  const uploadLessonFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/uploads', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return `http://localhost:3001${data.url}`;
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
    <Box sx={{ pt: 3, pb: 12, px: 2, maxHeight: '100vh', overflowY: 'auto' }}>
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
              {b.type === 'text' && (
                <div dangerouslySetInnerHTML={{ __html: b.content }} />
              )}
              {b.type === 'image' && b.content && (
                <img
                  src={b.content}
                  alt="Изображение"
                  style={{ maxWidth: '300px', borderRadius: 8 }}
                />
              )}
              {b.type === 'video' && (
                <Typography color="text.secondary">Видео: {b.content}</Typography>
              )}
              {b.type === 'file' && b.content && (
                <a href={b.content} target="_blank" rel="noreferrer">
                  📎 {decodeURIComponent(b.content.split('/').pop() || 'Файл')}
                </a>
              )}
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
                              <ReactQuill
                                value={b.content}
                                onChange={(val) => {
                                  const copy = [...blocks];
                                  copy[idx].content = val;
                                  setBlocks(copy);
                                }}
                                modules={{
                                  toolbar: [
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ header: [1, 2, 3, false] }],
                                    [{ list: 'ordered' }, { list: 'bullet' }],
                                    ['link', 'clean'],
                                  ],
                                }}
                                formats={[
                                  'header',
                                  'bold', 'italic', 'underline', 'strike',
                                  'list', 'bullet',
                                  'link',
                                ]}
                                placeholder="Введите текст..."
                                style={{ minHeight: 120 }}
                              />
                            )}

                            {b.type === 'image' && (
                              <>
                                {b.content ? (
                                  <Box>
                                    <img
                                      src={b.content}
                                      alt="Превью"
                                      style={{
                                        maxWidth: '300px',
                                        borderRadius: 8,
                                        marginBottom: 8,
                                      }}
                                    />
                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={async () => {
                                          const input =
                                            document.createElement('input');
                                          input.type = 'file';
                                          input.accept = 'image/*';
                                          input.onchange = async () => {
                                            const file = input.files?.[0];
                                            if (file) {
                                              const url =
                                                await uploadLessonFile(file);
                                              const copy = [...blocks];
                                              copy[idx].content = url;
                                              setBlocks(copy);
                                            }
                                          };
                                          input.click();
                                        }}
                                      >
                                        Заменить
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                          const copy = [...blocks];
                                          copy[idx].content = '';
                                          setBlocks(copy);
                                        }}
                                      >
                                        Удалить
                                      </Button>
                                    </Stack>
                                  </Box>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    onClick={async () => {
                                      const input =
                                        document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = async () => {
                                        const file = input.files?.[0];
                                        if (file) {
                                          const url =
                                            await uploadLessonFile(file);
                                          const copy = [...blocks];
                                          copy[idx].content = url;
                                          setBlocks(copy);
                                        }
                                      };
                                      input.click();
                                    }}
                                  >
                                    Загрузить изображение
                                  </Button>
                                )}
                              </>
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

                            {b.type === 'file' && (
                              <>
                                {b.content ? (
                                  <Box>
                                    <a
                                      href={b.content}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ display: 'block', marginBottom: 8 }}
                                    >
                                      📎 {decodeURIComponent(b.content.split('/').pop() || 'Файл')}
                                    </a>
                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={async () => {
                                          const input = document.createElement('input');
                                          input.type = 'file';
                                          input.onchange = async () => {
                                            const file = input.files?.[0];
                                            if (file) {
                                              const url = await uploadLessonFile(file);
                                              const copy = [...blocks];
                                              copy[idx].content = url;
                                              setBlocks(copy);
                                            }
                                          };
                                          input.click();
                                        }}
                                      >
                                        Заменить
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                          const copy = [...blocks];
                                          copy[idx].content = '';
                                          setBlocks(copy);
                                        }}
                                      >
                                        Удалить
                                      </Button>
                                    </Stack>
                                  </Box>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    onClick={async () => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.onchange = async () => {
                                        const file = input.files?.[0];
                                        if (file) {
                                          const url = await uploadLessonFile(file);
                                          const copy = [...blocks];
                                          copy[idx].content = url;
                                          setBlocks(copy);
                                        }
                                      };
                                      input.click();
                                    }}
                                  >
                                    Прикрепить файл
                                  </Button>
                                )}
                              </>
                            )}
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
              <div ref={bottomRef} />
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      )}

      {/* Плавающая панель */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {/* Капсула с кнопками */}
        <Paper
          elevation={3}
          sx={{
            borderRadius: 99,
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Button
            onClick={() => setPreview(!preview)}
            sx={{ borderRadius: 99, textTransform: 'none' }}
          >
            {preview ? 'Редактировать' : 'Предпросмотр'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{ borderRadius: 99, textTransform: 'none' }}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{ borderRadius: 99, textTransform: 'none' }}
          >
            Сохранить
          </Button>
        </Paper>

        {/* Кнопка + отдельно справа */}
        <IconButton
          sx={{
            borderRadius: 3,
            width: 48,
            height: 48,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { backgroundColor: 'primary.dark' },
          }}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <AddIcon />
        </IconButton>

        {/* Меню добавления блоков */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => handleAddBlock('text')}>
            <TextFieldsIcon fontSize="small" sx={{ mr: 1 }} /> Текст
          </MenuItem>
          <MenuItem onClick={() => handleAddBlock('image')}>
            <ImageIcon fontSize="small" sx={{ mr: 1 }} /> Изображение
          </MenuItem>
          <MenuItem onClick={() => handleAddBlock('video')}>
            <MovieIcon fontSize="small" sx={{ mr: 1 }} /> Видео
          </MenuItem>
          <MenuItem onClick={() => handleAddBlock('file')}>
            <AttachFileIcon fontSize="small" sx={{ mr: 1 }} /> Файл
          </MenuItem>
        </Menu>
      </Box>

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
