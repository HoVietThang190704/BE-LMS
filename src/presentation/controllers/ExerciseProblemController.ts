import { Request, Response } from 'express';
import { ExerciseProblemService } from '../../services/ExerciseProblemService';
import { HTTP_STATUS } from '../../shared/constants/httpStatus';
import { logger } from '../../shared/utils/logger';

const exerciseProblemService = new ExerciseProblemService();

export class ExerciseProblemController {
  
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, title, order, description, temp_code, testcase } = req.body;

      if (!courseId || !title || order === undefined || !description || !temp_code) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Missing required fields: courseId, title, order, description, temp_code'
        });
        return;
      }

      const newExercise = await exerciseProblemService.createExerciseProblem({
        courseId,
        title,
        order,
        description,
        temp_code,
        testcase
      });

      logger.info(`Exercise problem created: ${newExercise._id} for course ${courseId}`);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Exercise created successfully',
        data: newExercise
      });
    } catch (error: any) {
      logger.error(`Error creating exercise: ${error.message}`);

      if (error.message.includes('Course not found')) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error creating exercise'
      });
    }
  }

  static async getList(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.query;
      
      const exercises = await exerciseProblemService.getExerciseProblems(
        courseId as string
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: exercises
      });
    } catch (error: any) {
      logger.error(`Error getting exercises: ${error.message}`);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error getting exercises'
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const exercise = await exerciseProblemService.getExerciseProblemById(id);

      if (!exercise) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Exercise not found'
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: exercise
      });
    } catch (error: any) {
      logger.error(`Error getting exercise: ${error.message}`);

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error getting exercise'
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const updated = await exerciseProblemService.updateExerciseProblem(id, req.body);

      logger.info(`Exercise problem updated: ${id}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Exercise updated successfully',
        data: updated
      });
    } catch (error: any) {
      logger.error(`Error updating exercise: ${error.message}`);

      if (error.message.includes('Exercise not found')) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Exercise not found'
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
        message: error.message || 'Error updating exercise'
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await exerciseProblemService.deleteExerciseProblem(id);

      logger.info(`Exercise problem deleted: ${id}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Exercise deleted successfully'
      });
    } catch (error: any) {
      logger.error(`Error deleting exercise: ${error.message}`);

      if (error.message.includes('Exercise not found')) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Exercise not found'
        });
        return;
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Error deleting exercise'
      });
    }
  }
}
