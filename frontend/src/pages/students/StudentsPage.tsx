import { useEffect, useState } from 'react';
import { useStudentsApi } from './hooks/useStudentsApi';
import { Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function StudentsPage() {
  const api = useStudentsApi();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSubjects().then(setSubjects).finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <div className="p-6">
      <Typography variant="h5" fontWeight="600" gutterBottom>
        Учащиеся — предметы
      </Typography>

      <Grid container spacing={2}>
        {subjects.map((s) => (
          <Grid item xs={12} sm={6} md={4} key={s.id}>
            <Card
              className="cursor-pointer transition hover:shadow-lg"
              onClick={() => navigate(`/students/${s.id}`)}
            >
              <CardContent>
                <Typography variant="h6">{s.title}</Typography>
                <Typography color="text.secondary" fontSize="0.875rem">
                  Обновлено: {new Date(s.updatedAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
