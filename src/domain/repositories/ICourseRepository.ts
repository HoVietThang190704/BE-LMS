import { Course } from "../entities/Course.entity";

export interface ICourseRepository {
  create(course: Course): Promise<Course>;
  findAllByOwner(ownerId: string, keyword?: string, page?: number, limit?: number): Promise<{ data: Course[]; total: number }>;
  // Lấy danh sách công khai (public) — không lọc theo owner
  findAll(keyword?: string, page?: number, limit?: number): Promise<{ data: Course[]; total: number }>;
  findById(id: string): Promise<Course | null>;
  update(id: string, course: Partial<Course>): Promise<Course | null>;
  delete(id: string): Promise<boolean>;
  incrementEnrolledCount(id: string, delta: number): Promise<Course | null>;
  
}