import crypto from 'crypto';
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
  visibility: 'public' | 'private';
  requireApproval: boolean;
  invitationCode: string;
  instructor?: string | null;
  schedule?: string | null;
  room?: string | null;
  credits?: number;
  enrolled?: number;
  capacity?: number;
  startDate?: Date;
  endDate?: Date;
  syllabus?: { title?: string; description?: string }[];
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
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
    index: true
  },
  requireApproval: {
    type: Boolean,
    default: false
  },
  invitationCode: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  credits: { type: Number, default: 3 },
  instructor: { type: String, default: null },
  schedule: { type: String, default: null },
  room: { type: String, default: null },
  enrolled: { type: Number, default: 0 },
  capacity: { type: Number, default: 60 },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  syllabus: [{
    title: { type: String },
    description: { type: String }
  }]
}, { 
  timestamps: true // Tự động tạo createdAt, updatedAt
});

function generateInvitationCode(length = 8) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
}

CourseSchema.pre('validate', function (next) {
  if (!this.invitationCode) {
    this.invitationCode = generateInvitationCode(8);
  } else {
    this.invitationCode = String(this.invitationCode).toUpperCase();
  }
  next();
});

// Tạo index text để hỗ trợ tìm kiếm theo tên hoặc code (như yêu cầu "Tìm theo name hoặc code")
CourseSchema.index({ name: 'text', code: 'text' });

export default mongoose.model<CourseDocument>('Course', CourseSchema);