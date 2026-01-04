import PracticeExerciseModel, { IPracticeExercise, IPracticeTestCase } from '../../models/exercises/PracticeExercise';
import PracticeSubmissionModel, { IPracticeSubmission, IPracticeTestResult } from '../../models/exercises/PracticeSubmission';
import CourseModel from '../../models/courses/Course';
import mongoose from 'mongoose';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

const LANGUAGE_VERSIONS: Record<string, string> = {
  python: '3.10.0',
  java: '15.0.2',
  c: '10.2.0',
  cpp: '10.2.0',
  rust: '1.56.1',
  javascript: '18.15.0',
};

interface PistonResponse {
  run?: {
    output?: string;
    stderr?: string;
    code?: number;
  };
  compile?: {
    output?: string;
    stderr?: string;
    code?: number;
  };
  message?: string;
}

export class PracticeExerciseService {
  
  async createPractice(data: Partial<IPracticeExercise>): Promise<IPracticeExercise> {
    const { courseId, title, description, testCases = [] } = data;

    if (!courseId) {
      throw new Error('courseId is required');
    }

    if (!title) {
      throw new Error('title is required');
    }

    if (!description) {
      throw new Error('description is required');
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (testCases.length === 0) {
      throw new Error('At least one test case is required');
    }

    const practice = new PracticeExerciseModel({
      ...data,
      courseId,
      title,
      description,
      testCases
    });

    return await practice.save();
  }

  async getPracticesByCourse(courseId: string): Promise<IPracticeExercise[]> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid courseId');
    }

    return await PracticeExerciseModel.find({ courseId })
      .populate('courseId', 'name code')
      .sort({ order: 1, createdAt: -1 });
  }

  async getPractices(courseId?: string): Promise<IPracticeExercise[]> {
    let query: Record<string, unknown> = {};
    
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid courseId');
      }
      query.courseId = courseId;
    }

    return await PracticeExerciseModel.find(query)
      .populate('courseId', 'name code')
      .sort({ order: 1, createdAt: -1 });
  }

  async getPracticeById(id: string): Promise<IPracticeExercise | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid practice ID');
    }

    return await PracticeExerciseModel.findById(id)
      .populate('courseId', 'name code');
  }

  async getPracticeForStudent(id: string): Promise<Partial<IPracticeExercise> | null> {
    const practice = await this.getPracticeById(id);
    if (!practice) return null;

    const visibleTestCases = practice.testCases.filter(tc => !tc.isHidden);

    return {
      _id: practice._id,
      courseId: practice.courseId,
      title: practice.title,
      description: practice.description,
      order: practice.order,
      difficulty: practice.difficulty,
      language: practice.language,
      templateCode: practice.templateCode,
      testCases: visibleTestCases,
      constraints: practice.constraints,
      hints: practice.hints,
      sampleInput: practice.sampleInput,
      sampleOutput: practice.sampleOutput,
      timeLimit: practice.timeLimit,
      memoryLimit: practice.memoryLimit
    };
  }

  async updatePractice(id: string, updateData: Partial<IPracticeExercise>): Promise<IPracticeExercise | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid practice ID');
    }

    const { courseId, ...allowedUpdates } = updateData;

    if (courseId) {
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      (allowedUpdates as Record<string, unknown>).courseId = courseId;
    }

    return await PracticeExerciseModel.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).populate('courseId', 'name code');
  }

  async deletePractice(id: string): Promise<IPracticeExercise | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid practice ID');
    }

    await PracticeSubmissionModel.deleteMany({ practiceId: id });

    return await PracticeExerciseModel.findByIdAndDelete(id);
  }

  private async executeCode(language: string, code: string, input: string): Promise<{ output: string; error?: string; executionTime?: number }> {
    try {
      const pistonLang = language === 'cpp' ? 'c++' : language;
      const version = LANGUAGE_VERSIONS[language] || '*';

      type PistonPayload = {
        language: string;
        version?: string;
        files: { content: string }[];
        stdin: string;
        run_timeout: number;
      };

      const payload: PistonPayload = {
        language: pistonLang,
        version: version,
        files: [{ content: code }],
        stdin: input || '',
        run_timeout: 10000,
      };

      const fetchWithPayload = (body: PistonPayload) =>
        fetch(PISTON_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

      const startTime = Date.now();
      let response = await fetchWithPayload(payload);

      if (!response.ok) {
        const errorText = await response.text();
        const isOverrideError =
          typeof errorText === 'string' &&
          errorText.toLowerCase().includes('language override unsupported');

        if (isOverrideError) {
          const fallbackPayload: PistonPayload = { ...payload };
          delete fallbackPayload.version;
          response = await fetchWithPayload(fallbackPayload);
        } else {
          throw new Error(`Piston API error: ${response.status}`);
        }
      }

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Piston API error: ${response.status}`);
      }

      const data: PistonResponse = await response.json();

      if (data.compile?.code && data.compile.code !== 0) {
        return {
          output: '',
          error: data.compile.output || data.compile.stderr || 'Compilation error',
          executionTime
        };
      }

      if (data.run?.code && data.run.code !== 0) {
        return {
          output: data.run.output || '',
          error: data.run.stderr || 'Runtime error',
          executionTime
        };
      }

      return {
        output: (data.run?.output || '').trim(),
        executionTime
      };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  async submitPractice(
    practiceId: string, 
    studentId: string, 
    code: string,
    language: string
  ): Promise<IPracticeSubmission> {
    if (!mongoose.Types.ObjectId.isValid(practiceId)) {
      throw new Error('Invalid practice ID');
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error('Invalid student ID');
    }

    const practice = await PracticeExerciseModel.findById(practiceId);
    if (!practice) {
      throw new Error('Practice exercise not found');
    }

    const testResults: IPracticeTestResult[] = [];
    let passedTests = 0;
    let totalScore = 0;
    let totalPoints = 0;
    let totalExecutionTime = 0;

    for (const testCase of practice.testCases) {
      totalPoints += testCase.points;
      
      const { output, error, executionTime = 0 } = await this.executeCode(
        language,
        code,
        testCase.input
      );

      totalExecutionTime += executionTime;

      const expectedOutput = testCase.expectedOutput.trim();
      const actualOutput = output.trim();
      const passed = !error && actualOutput === expectedOutput;

      if (passed) {
        passedTests++;
        totalScore += testCase.points;
      }

      testResults.push({
        testCaseId: testCase.id,
        passed,
        input: testCase.isHidden ? '[Hidden]' : testCase.input,
        expectedOutput: testCase.isHidden ? '[Hidden]' : expectedOutput,
        actualOutput: testCase.isHidden && !passed ? '[Hidden]' : actualOutput,
        executionTime,
        error: error || undefined,
        pointsEarned: passed ? testCase.points : 0,
        isHidden: !!testCase.isHidden
      });
    }

    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const passed = passedTests === practice.testCases.length;

    const submission = new PracticeSubmissionModel({
      practiceId,
      studentId,
      code,
      language,
      testResults,
      passedTests,
      totalTests: practice.testCases.length,
      score: totalScore,
      totalPoints,
      percentage,
      passed,
      executionTime: totalExecutionTime,
      submittedAt: new Date()
    });

    return await submission.save();
  }

  async getStudentSubmissions(practiceId: string, studentId: string): Promise<IPracticeSubmission[]> {
    return await PracticeSubmissionModel.find({ practiceId, studentId })
      .sort({ submittedAt: -1 });
  }

  async getPracticeSubmissions(practiceId: string): Promise<IPracticeSubmission[]> {
    return await PracticeSubmissionModel.find({ practiceId })
      .populate('studentId', 'fullName email')
      .sort({ submittedAt: -1 });
  }

  async getStudentBestSubmission(practiceId: string, studentId: string): Promise<IPracticeSubmission | null> {
    return await PracticeSubmissionModel.findOne({ practiceId, studentId })
      .sort({ percentage: -1, submittedAt: -1 });
  }
}

export const practiceExerciseService = new PracticeExerciseService();
