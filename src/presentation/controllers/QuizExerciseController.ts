import { Request, Response } from 'express';
import { quizExerciseService } from '../../services/exercises/QuizExerciseService';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';

interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: string;
  };
}

export class QuizExerciseController {
  
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const quiz = await quizExerciseService.createQuiz(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Quiz created successfully',
        data: quiz
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create quiz';
      const status = message.includes('not found') ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.BAD_REQUEST;
      res.status(status).json({
        success: false,
        message
      });
    }
  }

  static async getList(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.query;
      const quizzes = await quizExerciseService.getQuizzes(courseId as string | undefined);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: quizzes,
        meta: { total: quizzes.length }
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get quizzes'
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quiz = await quizExerciseService.getQuizById(id);
      
      if (!quiz) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Quiz not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: quiz
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get quiz'
      });
    }
  }

  static async getForStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quiz = await quizExerciseService.getQuizForStudent(id);
      
      if (!quiz) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Quiz not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: quiz
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get quiz'
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quiz = await quizExerciseService.updateQuiz(id, req.body);
      
      if (!quiz) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Quiz not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Quiz updated successfully',
        data: quiz
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update quiz'
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quiz = await quizExerciseService.deleteQuiz(id);
      
      if (!quiz) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Quiz not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Quiz deleted successfully'
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete quiz'
      });
    }
  }

  static async submit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { answers, startedAt } = req.body;
      const studentId = req.user?.id;

      if (!studentId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!answers || !Array.isArray(answers)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Answers are required'
        });
        return;
      }

      const submission = await quizExerciseService.submitQuiz(
        id,
        studentId,
        answers,
        new Date(startedAt)
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Quiz submitted successfully',
        data: submission
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit quiz'
      });
    }
  }

  static async getMySubmissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = req.user?.id;

      if (!studentId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const submissions = await quizExerciseService.getStudentSubmissions(id, studentId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: submissions,
        meta: { total: submissions.length }
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get submissions'
      });
    }
  }

  static async getAllSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const submissions = await quizExerciseService.getQuizSubmissions(id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: submissions,
        meta: { total: submissions.length }
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get submissions'
      });
    }
  }
}
