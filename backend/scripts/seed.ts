// backend/scripts/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();

  // Хешируем пароли
  const hashStudent = await bcrypt.hash('StudentPass123', 10);
  const hashTeacher = await bcrypt.hash('TeacherPass123', 10);
  const hashAdmin   = await bcrypt.hash('AdminPass123', 10);

  // Массив пользователей с правильным enum Role
  const users: Array<{
    email: string;
    passwordHash: string;
    role: Role;
  }> = [
    { email: 'student@cubit.local', passwordHash: hashStudent, role: Role.STUDENT },
    { email: 'teacher@cubit.local', passwordHash: hashTeacher, role: Role.TEACHER },
    { email: 'admin@cubit.local',   passwordHash: hashAdmin,   role: Role.ADMIN },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
      },
    });
  }

  console.log('✅ Seed completed: student@cubit.local / StudentPass123, teacher@cubit.local / TeacherPass123, admin@cubit.local / AdminPass123');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
