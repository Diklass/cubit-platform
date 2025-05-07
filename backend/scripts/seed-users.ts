// backend/scripts/seed-users.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();

  const hashTeacher = await bcrypt.hash('TeacherPass123', 10);
  const hashAdmin   = await bcrypt.hash('AdminPass123', 10);

  await prisma.user.upsert({
    where: { email: 'teacher@cubit.local' },
    update: {},
    create: {
      email: 'teacher@cubit.local',
      passwordHash: hashTeacher,
      role: 'TEACHER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@cubit.local' },
    update: {},
    create: {
      email: 'admin@cubit.local',
      passwordHash: hashAdmin,
      role: 'ADMIN',
    },
  });

  console.log('✅ Teacher и Admin созданы');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
