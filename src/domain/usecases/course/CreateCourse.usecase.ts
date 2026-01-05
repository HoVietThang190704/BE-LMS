import crypto from "crypto";
import { Course, ICourse } from "../../entities/Course.entity";
import { ICourseRepository } from "../../repositories/ICourseRepository";

const generateInvitationCode = (length = 8) =>
  crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();

export class CreateCourseUseCase {
  constructor(private courseRepo: ICourseRepository) {}

  // SỬA DÒNG NÀY: Thêm 'status' vào danh sách Omit để không bắt buộc truyền vào
  async execute(input: Omit<ICourse, '_id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ICourse> {
    
    // Validate cơ bản
    if (!input.code || !input.name) {
      throw new Error("Missing required fields");
    }
    
    // Ép kiểu về Entity
    // Lúc này UseCase sẽ tự gán status = 'active'
    const newCourse = new Course(
      input.code,
      input.name,
      input.ownerId,
      undefined, // _id (để DB tự sinh)
      input.description,
      input.image,
      input.tags,
      'active', // status
      input.visibility ?? 'public',
      input.requireApproval ?? false,
      input.invitationCode || generateInvitationCode(),
      input.credits,
      input.instructor,
      input.schedule,
      input.room,
      input.enrolled,
      input.capacity,
      input.syllabus,
      undefined, 
      input.startDate,
      input.endDate,
      undefined, 
      undefined  
    );

    return await this.courseRepo.create(newCourse);
  }
}