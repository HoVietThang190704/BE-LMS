import { Request, Response } from 'express';
import { CreateSectionUsecase } from '../../domain/usecases/section/CreateSection.usecase';
import { GetSectionsUsecase } from '../../domain/usecases/section/GetSections.usecase';
import { GetSectionByIdUsecase } from '../../domain/usecases/section/GetSectionById.usecase';
import { UpdateSectionUsecase } from '../../domain/usecases/section/UpdateSection.usecase';
import { DeleteSectionUsecase } from '../../domain/usecases/section/DeleteSection.usecase';
import { SectionRepository } from '../../data/repositories/SectionRepository';

const sectionRepo = new SectionRepository();

export class SectionController {
  static async create(req: Request, res: Response) {
    try {
      // Giả định middleware auth gán req.user: { userId: string; email: string; role: string }
      if (!req.user || !('userId' in req.user)) {
        return res.status(401).json({ message: 'Unauthorized: missing user info' });
      }
      const teacherId = (req.user as { userId: string }).userId;
      // Cho phép truyền courseCode thay vì courseId
      let body = { ...req.body };
      if (!body.courseId && body.courseCode) {
        // Tìm courseId theo code
        const CourseModel = require('../../models/courses/Course').default;
        const course = await CourseModel.findOne({ code: body.courseCode });
        if (!course) {
          return res.status(400).json({ message: 'Course code không tồn tại' });
        }
        body.courseId = course._id;
      }
      const usecase = new CreateSectionUsecase(sectionRepo);
      const section = await usecase.execute(body, teacherId);
      return res.status(201).json(section);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const filter: any = {};
      if (req.query.term) filter.term = req.query.term;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.courseId) filter.courseId = req.query.courseId;
      const usecase = new GetSectionsUsecase(sectionRepo);
      const sections = await usecase.execute(filter);
      return res.json(sections);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  static async detail(req: Request, res: Response) {
    try {
      const usecase = new GetSectionByIdUsecase(sectionRepo);
      const section = await usecase.execute(req.params.id);
      if (!section) return res.status(404).json({ message: 'Section not found' });
      return res.json(section);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      // Validate status nếu có
      const allowedStatuses = ['planned', 'ongoing', 'completed', 'cancelled'];
      if (
        Object.prototype.hasOwnProperty.call(req.body, 'status') &&
        !allowedStatuses.includes(req.body.status)
      ) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      // Validate schedule.dayOfWeek nếu có
      if (Array.isArray(req.body.schedule)) {
        for (const item of req.body.schedule) {
          let isValid = false;
          if (typeof item.dayOfWeek === 'number') {
            if (item.dayOfWeek >= 2 && item.dayOfWeek <= 7) isValid = true;
          } else if (typeof item.dayOfWeek === 'string') {
            const val = item.dayOfWeek.trim().toLowerCase().normalize('NFC');
            if (val === 'cn' || val === 'chủ nhật' || val === 'chu nhat') isValid = true;
          }
          if (!isValid) {
            return res.status(400).json({ message: 'Invalid dayOfWeek' });
          }
        }
      }
      const usecase = new UpdateSectionUsecase(sectionRepo);
      const section = await usecase.execute(req.params.id, req.body);
      if (!section) return res.status(404).json({ message: 'Section not found' });
      return res.json(section);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const usecase = new DeleteSectionUsecase(sectionRepo);
      await usecase.execute(req.params.id);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }
}
