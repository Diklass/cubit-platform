// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  // 1) Пользователи
  await prisma.user.createMany({
    data: [
      { email: 'student@cubit.local', passwordHash: await hash('StudentPass123'), role: Role.STUDENT },
      { email: 'teacher@cubit.local', passwordHash: await hash('TeacherPass123'), role: Role.TEACHER },
      { email: 'admin@cubit.local',   passwordHash: await hash('AdminPass123'),   role: Role.ADMIN },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Пользователи готовы');

  // 2) Получим id
  const teacher = await prisma.user.findUniqueOrThrow({ where: { email: 'teacher@cubit.local' } });
  const student = await prisma.user.findUniqueOrThrow({ where: { email: 'student@cubit.local' } });

  // 3) Предмет (если нет — создадим)
  const subject = await prisma.subject.upsert({
    where: { id: 'seed-subject-1' }, // фиксированный id не обязателен; можно искать по title
    update: {},
    create: {
      id: 'seed-subject-1',
      title: 'Информатика',
      modules: {
        create: [
          {
            title: 'Основы программирования',
            lessons: {
              create: [
                { title: 'Введение в Python', teacherId: teacher.id },
                { title: 'Переменные и типы данных', teacherId: teacher.id },
              ],
            },
          },
        ],
      },
    },
    include: { modules: { include: { lessons: true } } },
  });

  // 4) Группа (если нет — создадим)
  const group = await prisma.studentGroup.upsert({
    where: { id: 'seed-group-A' },
    update: {},
    create: { id: 'seed-group-A', name: 'Группа A', subjectId: subject.id },
  });

  // 5) Привязка студента к предмету (в группу)
  await prisma.subjectStudent.upsert({
    where: { subjectId_userId: { subjectId: subject.id, userId: student.id } },
    update: { groupId: group.id },
    create: { subjectId: subject.id, userId: student.id, groupId: group.id },
  });

  console.log('✅ Предмет/модули/уроки/группа/связи готовы');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
