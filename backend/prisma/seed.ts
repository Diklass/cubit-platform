// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = async (password: string) => await bcrypt.hash(password, 10);

  await prisma.user.createMany({
    data: [
      {
        email: 'student@cubit.local',
        passwordHash: await passwordHash('StudentPass123'),
        role: 'STUDENT',
      },
      {
        email: 'teacher@cubit.local',
        passwordHash: await passwordHash('TeacherPass123'),
        role: 'TEACHER',
      },
      {
        email: 'admin@cubit.local',
        passwordHash: await passwordHash('AdminPass123'),
        role: 'ADMIN',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Пользователи успешно добавлены');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
