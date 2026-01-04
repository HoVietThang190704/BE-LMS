import QuizExerciseModel, { IQuizExercise, IQuizQuestion } from '../../models/exercises/QuizExercise';
import QuizSubmissionModel, { IQuizSubmission, IQuizAnswer } from '../../models/exercises/QuizSubmission';
import CourseModel from '../../models/courses/Course';
import mongoose from 'mongoose';

export class QuizExerciseService {
  
  async createQuiz(data: Partial<IQuizExercise>): Promise<IQuizExercise> {
    const { courseId, title, questions = [] } = data;

    if (!courseId) {
      throw new Error('courseId is required');
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (questions.length === 0) {
      throw new Error('At least one question is required');
    }

    for (const q of questions) {
      if (!q.options || q.options.length < 2) {
        throw new Error('Each question must have at least 2 options');
      }
      const correctOptions = q.options.filter(o => o.isCorrect);
      if (correctOptions.length === 0) {
        throw new Error('Each question must have at least one correct answer');
      }
    }

    const quiz = new QuizExerciseModel({
      ...data,
      courseId,
      title,
      questions
    });

    return await quiz.save();
  }

  async getQuizzesByCourse(courseId: string): Promise<IQuizExercise[]> {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Invalid courseId');
    }

    return await QuizExerciseModel.find({ courseId })
      .populate('courseId', 'name code')
      .sort({ order: 1, createdAt: -1 });
  }

  async getQuizzes(courseId?: string): Promise<IQuizExercise[]> {
    let query: Record<string, unknown> = {};
    
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('Invalid courseId');
      }
      query.courseId = courseId;
    }

    return await QuizExerciseModel.find(query)
      .populate('courseId', 'name code')
      .sort({ order: 1, createdAt: -1 });
  }

  async getQuizById(id: string): Promise<IQuizExercise | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid quiz ID');
    }

    return await QuizExerciseModel.findById(id)
      .populate('courseId', 'name code');
  }

  async getQuizForStudent(id: string): Promise<Partial<IQuizExercise> | null> {
    const quiz = await this.getQuizById(id);
    if (!quiz) return null;

    const sanitizedQuestions = quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options.map(o => ({
        id: o.id,
        text: o.text
      })),
      points: q.points
    }));

    return {
      _id: quiz._id,
      courseId: quiz.courseId,
      title: quiz.title,
      description: quiz.description,
      order: quiz.order,
      questions: sanitizedQuestions as IQuizQuestion[],
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      allowRetake: quiz.allowRetake,
      maxAttempts: quiz.maxAttempts,
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleOptions: quiz.shuffleOptions
    };
  }

  async updateQuiz(id: string, updateData: Partial<IQuizExercise>): Promise<IQuizExercise | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid quiz ID');
    }

    const { courseId, ...allowedUpdates } = updateData;

    if (courseId) {
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      (allowedUpdates as Record<string, unknown>).courseId = courseId;
    }

    if (allowedUpdates.questions) {
      for (const q of allowedUpdates.questions) {
        if (!q.options || q.options.length < 2) {
          throw new Error('Each question must have at least 2 options');
        }
        const correctOptions = q.options.filter(o => o.isCorrect);
        if (correctOptions.length === 0) {
          throw new Error('Each question must have at least one correct answer');
        }
      }
    }

    return await QuizExerciseModel.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).populate('courseId', 'name code');
  }

  async deleteQuiz(id: string): Promise<IQuizExercise | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid quiz ID');
    }

    await QuizSubmissionModel.deleteMany({ quizId: id });

    return await QuizExerciseModel.findByIdAndDelete(id);
  }

  async submitQuiz(
    quizId: string, 
    studentId: string, 
    answers: Array<{ questionId: string; selectedOptionId: string }>,
    startedAt: Date
  ): Promise<IQuizSubmission> {
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      throw new Error('Invalid quiz ID');
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error('Invalid student ID');
    }

    const quiz = await QuizExerciseModel.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const existingAttempts = await QuizSubmissionModel.countDocuments({ 
      quizId, 
      studentId 
    });

    if (!quiz.allowRetake && existingAttempts > 0) {
      throw new Error('Retakes are not allowed for this quiz');
    }

    if (quiz.maxAttempts && existingAttempts >= quiz.maxAttempts) {
      throw new Error(`Maximum attempts (${quiz.maxAttempts}) reached`);
    }

    const gradedAnswers: IQuizAnswer[] = [];
    let totalScore = 0;
    let totalPoints = 0;

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const studentAnswer = answers.find(a => a.questionId === question.id);
      
      if (studentAnswer) {
        const selectedOption = question.options.find(o => o.id === studentAnswer.selectedOptionId);
        const isCorrect = selectedOption?.isCorrect || false;
        const pointsEarned = isCorrect ? question.points : 0;
        totalScore += pointsEarned;

        gradedAnswers.push({
          questionId: question.id,
          selectedOptionId: studentAnswer.selectedOptionId,
          isCorrect,
          pointsEarned
        });
      }
    }

    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;
    const submittedAt = new Date();
    const timeSpent = Math.floor((submittedAt.getTime() - new Date(startedAt).getTime()) / 1000);

    const submission = new QuizSubmissionModel({
      quizId,
      studentId,
      answers: gradedAnswers,
      score: totalScore,
      totalPoints,
      percentage,
      passed,
      attemptNumber: existingAttempts + 1,
      startedAt,
      submittedAt,
      timeSpent
    });

    return await submission.save();
  }

  async getStudentSubmissions(quizId: string, studentId: string): Promise<IQuizSubmission[]> {
    return await QuizSubmissionModel.find({ quizId, studentId })
      .sort({ submittedAt: -1 });
  }

  async getQuizSubmissions(quizId: string): Promise<IQuizSubmission[]> {
    return await QuizSubmissionModel.find({ quizId })
      .populate('studentId', 'fullName email')
      .sort({ submittedAt: -1 });
  }
}

export const quizExerciseService = new QuizExerciseService();
