import Exercise from '../../models/exercises/Exercise';

export async function seedExercisesIfNeeded() {
  try {
    const count = await Exercise.countDocuments();
    if (count > 0) return;

    const sample = {
      title: 'Sum of Two Numbers',
      description: 'Write a program that reads two integers and prints their sum.',
      difficulty: 'easy',
      language: 'python',
      template: `a = int(input())\nb = int(input())\nprint(a + b)`,
      testCases: [
        { id: '1', input: '3\n5', expectedOutput: '8', visible: true, explanation: '3 + 5 = 8' },
        { id: '2', input: '10\n20', expectedOutput: '30', visible: true },
        { id: '3', input: '-5\n5', expectedOutput: '0', visible: false }
      ],
      constraints: '-1000 ≤ a, b ≤ 1000',
      examples: [{ input: '3\n5', output: '8', explanation: 'Add the two numbers' }],
      timeLimit: 10000,
      memoryLimit: 256000
    };

    await Exercise.create(sample);
    console.info('Seed: inserted sample exercise');
  } catch (err: any) {
    console.error('Seed error:', err.message || err);
  }
}
