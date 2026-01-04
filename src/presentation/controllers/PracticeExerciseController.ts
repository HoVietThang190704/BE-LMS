import { Request, Response } from 'express';
import { practiceExerciseService } from '../../services/exercises/PracticeExerciseService';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';

interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: string;
  };
}

export class PracticeExerciseController {
  
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const practice = await practiceExerciseService.createPractice(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Practice exercise created successfully',
        data: practice
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create practice exercise';
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
      const practices = await practiceExerciseService.getPractices(courseId as string | undefined);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: practices,
        meta: { total: practices.length }
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get practice exercises'
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const practice = await practiceExerciseService.getPracticeById(id);
      
      if (!practice) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Practice exercise not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: practice
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get practice exercise'
      });
    }
  }

  static async getForStudent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const practice = await practiceExerciseService.getPracticeForStudent(id);
      
      if (!practice) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Practice exercise not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: practice
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get practice exercise'
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const practice = await practiceExerciseService.updatePractice(id, req.body);
      
      if (!practice) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Practice exercise not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Practice exercise updated successfully',
        data: practice
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update practice exercise'
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const practice = await practiceExerciseService.deletePractice(id);
      
      if (!practice) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Practice exercise not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Practice exercise deleted successfully'
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete practice exercise'
      });
    }
  }

  static async submit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { code, language } = req.body;
      const studentId = req.user?.id;

      console.log('[PracticeExerciseController.submit] Request:', {
        practiceId: id,
        studentId,
        language,
        codeLength: code?.length || 0
      });

      if (!studentId) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      if (!code) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Code is required'
        });
        return;
      }

      if (!language) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Language is required'
        });
        return;
      }

      const submission = await practiceExerciseService.submitPractice(
        id,
        studentId,
        code,
        language
      );


      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Practice submitted successfully',
        data: submission
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit practice'
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

      const submissions = await practiceExerciseService.getStudentSubmissions(id, studentId);

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
      const submissions = await practiceExerciseService.getPracticeSubmissions(id);

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

  static async getMyBestSubmission(req: AuthRequest, res: Response): Promise<void> {
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

      const submission = await practiceExerciseService.getStudentBestSubmission(id, studentId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: submission
      });
    } catch (error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get best submission'
      });
    }
  }
}
