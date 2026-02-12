import { PrismaClient, Role, ExerciseType, DayOfWeek, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function randomBirthDate() {
  const start = new Date('1955-01-01T00:00:00.000Z');
  const end = new Date('2010-12-31T00:00:00.000Z');
  const diff = end.getTime() - start.getTime();
  return new Date(start.getTime() + Math.random() * diff);
}

function randomName() {
  const first = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gabi', 'Henrique', 'Isabela', 'Joao', 'Larissa', 'Marcos', 'Natalia', 'Otavio', 'Paula', 'Renato', 'Sofia', 'Thiago', 'Vanessa', 'Wesley'];
  const last = ['Silva', 'Souza', 'Oliveira', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nunes', 'Lima', 'Gomes'];
  return `${pick(first)} ${pick(last)}`;
}

function randomEmail(index: number) {
  return `aluno${index}@siga.com.br`;
}

function randomWorkoutTitle() {
  const parts = ['A', 'B', 'C', 'D'];
  const focuses = ['Superior', 'Inferior', 'Cardio', 'Full Body', 'Core'];
  return `Treino ${pick(parts)} - ${pick(focuses)}`;
}

function randomExercise() {
  const exercises = [
    { name: 'Supino Reto', type: ExerciseType.STRENGTH },
    { name: 'Agachamento', type: ExerciseType.STRENGTH },
    { name: 'Remada Curvada', type: ExerciseType.STRENGTH },
    { name: 'Leg Press', type: ExerciseType.STRENGTH },
    { name: 'Desenvolvimento', type: ExerciseType.STRENGTH },
    { name: 'Esteira', type: ExerciseType.CARDIO },
    { name: 'Bicicleta', type: ExerciseType.CARDIO },
    { name: 'Prancha', type: ExerciseType.FLEXIBILITY },
  ];
  const base = pick(exercises);
  return {
    name: base.name,
    sets: base.type === ExerciseType.CARDIO ? 1 : randomInt(3, 5),
    reps: base.type === ExerciseType.CARDIO ? `${randomInt(15, 30)} min` : `${randomInt(8, 15)}`,
    weight: base.type === ExerciseType.CARDIO ? null : randomInt(10, 50),
    type: base.type,
  };
}

async function main() {
  await prisma.exercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('siga123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@siga.com.br',
      name: 'Victor Administrador',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const students = [] as { id: string; email: string; name: string }[];
  const genders = [Gender.MALE, Gender.FEMALE, Gender.OTHER, Gender.UNSPECIFIED];

  for (let i = 1; i <= 30; i += 1) {
    const student = await prisma.user.create({
      data: {
        email: randomEmail(i),
        name: randomName(),
        password: passwordHash,
        role: Role.STUDENT,
        gender: pick(genders),
        birthDate: randomBirthDate(),
      },
    });
    students.push({ id: student.id, email: student.email, name: student.name });
  }

  for (const student of students) {
    const workoutsCount = randomInt(2, 4);
    for (let w = 0; w < workoutsCount; w += 1) {
      const exercises = Array.from({ length: randomInt(3, 6) }).map(() => randomExercise());
      await prisma.workout.create({
        data: {
          title: randomWorkoutTitle(),
          description: 'Treino personalizado',
          dayOfWeek: pick([DayOfWeek.MON, DayOfWeek.TUE, DayOfWeek.WED, DayOfWeek.THU, DayOfWeek.FRI, DayOfWeek.SAT]),
          userId: student.id,
          exercises: { create: exercises },
        },
      });
    }
  }

  const today = new Date();
  const start = addDays(today, -60);
  for (const student of students) {
    for (let d = 0; d <= 60; d += 1) {
      const day = addDays(start, d);
      if (Math.random() < 0.4) {
        await prisma.attendance.create({
          data: {
            userId: student.id,
            checkIn: new Date(day.getFullYear(), day.getMonth(), day.getDate(), randomInt(6, 20), randomInt(0, 59), 0),
          },
        });
      }
    }
  }

  for (const student of students) {
    const notificationsCount = randomInt(1, 4);
    for (let i = 0; i < notificationsCount; i += 1) {
      const answered = Math.random() < 0.6;
      await prisma.notification.create({
        data: {
          type: pick(['Treino', 'Horario', 'Equipamento']),
          content: 'Tenho uma duvida sobre o treino.',
          read: answered,
          response: answered ? 'Resposta enviada pelo treinador.' : null,
          respondedAt: answered ? new Date() : null,
          userId: student.id,
        },
      });
    }
  }

  console.log('Seed finalizado com sucesso!');
  console.log(`Admin: ${admin.email} / senha: siga123`);
  console.log(`Alunos criados: ${students.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
