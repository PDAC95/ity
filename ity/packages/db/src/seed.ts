import { db } from './client';
import { creators, schools, courses, modules, lessons } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create test creator
  const creatorResult = await db
    .insert(creators)
    .values({
      email: 'dev@jappi.ca',
      name: 'Dev User',
      emailVerified: true,
    })
    .returning();

  const creator = creatorResult[0];
  if (!creator) throw new Error('Failed to create creator');

  console.log('✅ Created creator:', creator.email);

  // Create test school
  const schoolResult = await db
    .insert(schools)
    .values({
      creatorId: creator.id,
      name: 'Test School',
      slug: 'test-school',
      description: 'A test school for development',
    })
    .returning();

  const school = schoolResult[0];
  if (!school) throw new Error('Failed to create school');

  console.log('✅ Created school:', school.name);

  // Create test course
  const courseResult = await db
    .insert(courses)
    .values({
      schoolId: school.id,
      title: 'Getting Started with ITY',
      slug: 'getting-started',
      description: 'Learn how to use ITY to create your online school',
      shortDescription: 'A complete guide to ITY',
      isPublished: true,
    })
    .returning();

  const course = courseResult[0];
  if (!course) throw new Error('Failed to create course');

  console.log('✅ Created course:', course.title);

  // Create module
  const moduleResult = await db
    .insert(modules)
    .values({
      courseId: course.id,
      title: 'Introduction',
      description: 'Welcome to the course',
      order: 0,
    })
    .returning();

  const module1 = moduleResult[0];
  if (!module1) throw new Error('Failed to create module');

  console.log('✅ Created module:', module1.title);

  // Create lessons
  await db.insert(lessons).values([
    {
      moduleId: module1.id,
      title: 'Welcome to ITY',
      type: 'text',
      content: {
        html: '<h1>Welcome!</h1><p>Thank you for joining ITY. In this course, you will learn everything you need to create your online school.</p>',
      },
      order: 0,
      isFreePreview: true,
    },
    {
      moduleId: module1.id,
      title: 'Setting Up Your School',
      type: 'video',
      content: {},
      order: 1,
    },
    {
      moduleId: module1.id,
      title: 'Quick Quiz',
      type: 'quiz',
      content: {
        questions: [
          {
            id: '1',
            type: 'multiple-choice',
            question: 'What does ITY stand for?',
            options: ['I Teach You', 'I Train You', 'I Tell You', 'I Test You'],
            correctAnswer: 0,
            points: 10,
          },
        ],
        timeLimit: 300,
      },
      order: 2,
    },
  ]);

  console.log('✅ Created lessons');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('Test credentials:');
  console.log('  Email: dev@jappi.ca');
  console.log('  School: test-school');

  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
