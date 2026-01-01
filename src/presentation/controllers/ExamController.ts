import { Request, Response } from 'express';
import { ExamService } from '../../services/ExamService';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { logger } from '../../shared/utils/logger';

const examService = new ExamService();

export class ExamController {
  
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, title, order, description, correct_answer } = req.body;

      if (!courseId || !title || order === undefined || !description || correct_answer === undefined) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Missing required fields: courseId, title, order, description, correct_answer'
        });
        return;
      }

      const newExam = await examService.createExam({
        courseId,
        title,
        order,
        description,
        correct_answer
      });

      logger.info(`Exam created: ${newExam._id} for course ${courseId}`);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Exam created successfully',
        data: newExam
      });
    } catch (error: any) {
      logger.error(`Error creating exam: ${error.message}`);

      if (error.message.includes('Course not found')) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error creating exam'
      });
    }
  }

  static async getList(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.query;
      
      const exams = await examService.getExams(
        courseId as string
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: exams
      });
    } catch (error: any) {
      logger.error(`Error getting exams: ${error.message}`);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error getting exams'
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const exam = await examService.getExamById(id);

      if (!exam) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Exam not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: exam
      });
    } catch (error: any) {
      logger.error(`Error getting exam: ${error.message}`);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error getting exam'
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const updated = await examService.updateExam(id, req.body);

      logger.info(`Exam updated: ${id}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Exam updated successfully',
        data: updated
      });
    } catch (error: any) {
      logger.error(`Error updating exam: ${error.message}`);

      if (error.message.includes('Exam not found')) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Exam not found'
        });
        return;
      }

      if (error.message.includes('Course not found')) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error updating exam'
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await examService.deleteExam(id);

      logger.info(`Exam deleted: ${id}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Exam deleted successfully'
      });
    } catch (error: any) {
      logger.error(`Error deleting exam: ${error.message}`);

      if (error.message.includes('Exam not found')) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Exam not found'
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error deleting exam'
      });
    }
  }
}
