import mongoose, { Schema, Document } from 'mongoose';
// Import Interface từ Domain (nhớ sửa đường dẫn import cho đúng vị trí file)
// Nếu bạn chưa tạo file Interface ở Domain thì có thể bỏ dòng import này và định nghĩa tạm 'any'
import { ICourse } from '../../domain/entities/Course.entity'; 

// Kế thừa Interface từ Domain để đảm bảo tính nhất quán dữ liệu
export interface CourseDocument extends Document {
  code: string;
  name: string;
  description?: string;
  image?: string;
  ownerId: mongoose.Types.ObjectId; // Lưu ý kiểu ObjectId của Mongoose
  tags?: string[];
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema = new Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true // Tự động viết hoa mã môn (ví dụ: cs101 -> CS101)
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String 
  },
  image: {
    type: String
  },
  ownerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', // Ref tới collection users để sau này populate lấy thông tin GV
    required: true 
  },
  tags: [{ 
    type: String 
  }],
  status: { 
    type: String, 
    enum: ['active', 'archived'], 
    default: 'active' 
  },
  credits: { type: Number, default: 3 },
  instructor: { type: String, default: null },
  schedule: { type: String, default: null },
  room: { type: String, default: null },
  enrolled: { type: Number, default: 0 },
  capacity: { type: Number, default: 60 },
  syllabus: [{
    title: { type: String },
    description: { type: String }
  }]
}, { 
  timestamps: true // Tự động tạo createdAt, updatedAt
});

// Tạo index text để hỗ trợ tìm kiếm theo tên hoặc code (như yêu cầu "Tìm theo name hoặc code")
CourseSchema.index({ name: 'text', code: 'text' });

export default mongoose.model<CourseDocument>('Course', CourseSchema);