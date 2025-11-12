import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStudentsApi } from "./hooks/useStudentsApi";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Button,
  IconButton,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AddStudentDialog from "./components/AddStudentDialog";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { AnimatePresence } from "framer-motion";
import { StudentCard } from "./components/StudentCard";

import { GroupStatsPanel } from "./components/GroupStatsPanel";

export default function GroupStudentsPage() {
  const { subjectId, groupId } = useParams();
  const api = useStudentsApi();
  const [group, setGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);

  const load = () => {
    api.getGroups(subjectId!).then((data) => {
      const found =
        groupId === "none"
          ? { name: "Без группы", students: data.ungrouped }
          : data.groups.find((g: any) => g.id === groupId);
      setGroup(found);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [subjectId, groupId]);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box className="p-6">
  <Typography variant="h5" fontWeight="600" gutterBottom>
    {group?.name}
  </Typography>

  <Button
    startIcon={<AddRoundedIcon />}
    variant="contained"
    sx={{ mb: 3 }}
    onClick={() => setOpenAdd(true)}
  >
    Добавить учащегося
  </Button>

  {/* Список учеников */}
  <AnimatePresence>
    {group?.students?.length ? (
      group.students.map((s: any) => (
        <StudentCard
          key={s.id}
          subjectId={subjectId!}
          student={s}
          onRemoved={load}
        />
      ))
    ) : (
      <Typography color="text.secondary">
        В этой группе пока нет учащихся
      </Typography>
    )}
  </AnimatePresence>

  {/* 📊 Панель статистики */}
  {groupId !== "none" && (
    <GroupStatsPanel subjectId={subjectId!} groupId={groupId!} />
  )}

  <AddStudentDialog
    open={openAdd}
    onClose={() => setOpenAdd(false)}
    subjectId={subjectId!}
    groupId={groupId === "none" ? null : groupId}
    onAdded={load}
  />
</Box>
  );
}
