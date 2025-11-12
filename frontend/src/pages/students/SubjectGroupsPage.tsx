import { useParams, useNavigate } from 'react-router-dom';
import { SetStateAction, useEffect, useState } from 'react';
import { useStudentsApi } from './hooks/useStudentsApi';
import {
    Box, Typography, Grid, IconButton, Button, Dialog, TextField,
    CircularProgress, Card, CardContent
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { SubjectStatsPanel } from "./components/SubjectStatsPanel";

import { GroupCard } from "./components/GroupCard";

export default function SubjectGroupsPage() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const api = useStudentsApi();
    const [groups, setGroups] = useState<any[]>([]);
    const [ungrouped, setUngrouped] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openAdd, setOpenAdd] = useState(false);
    const [groupName, setGroupName] = useState('');

    const load = () =>
        api.getGroups(subjectId!)
            .then((r: { groups: SetStateAction<any[]>; ungrouped: SetStateAction<any[]>; }) => { setGroups(r.groups); setUngrouped(r.ungrouped); })
            .finally(() => setLoading(false));

    useEffect(() => { load(); }, [subjectId]);

    const handleCreate = () => {
        api.createGroup(subjectId!, groupName).then(() => {
            setGroupName('');
            setOpenAdd(false);
            load();
        });
    };

    if (loading) return <CircularProgress sx={{ mt: 4 }} />;

    return (
        <Box className="p-6">
            <Typography variant="h5" fontWeight="600" gutterBottom>
                Группы предмета
            </Typography>

            <Button
                startIcon={<AddRoundedIcon />}
                variant="contained"
                onClick={() => setOpenAdd(true)}
                sx={{ mb: 3 }}
            >
                Добавить группу
            </Button>

            <Grid container spacing={2}>
  {groups.map((g) => (
    <Grid item xs={12} sm={6} md={4} key={g.id}>
      <GroupCard group={g} subjectId={subjectId!} onReload={load} />
    </Grid>
  ))}

  {ungrouped.length > 0 && (
    <Grid item xs={12} sm={6} md={4}>
      <Card
        onClick={() => navigate(`/students/${subjectId}/none`)}
        className="cursor-pointer transition hover:shadow-lg"
      >
        <CardContent>
          <Typography variant="h6">Без группы</Typography>
          <Typography color="text.secondary">
            Учащихся: {ungrouped.length}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  )}
</Grid>

<SubjectStatsPanel subjectId={subjectId!} />

            <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
                <Box className="p-6 flex flex-col gap-3">
                    <Typography variant="h6">Новая группа</Typography>
                    <TextField
                        label="Название группы"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleCreate} disabled={!groupName.trim()}>
                        Создать
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}
