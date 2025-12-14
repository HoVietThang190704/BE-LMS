import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduleItem {
  dayOfWeek: number; // 2 = Monday, ...
  startTime: string; // "07:00"
  endTime: string;   // "09:00"
  room: string;
}

export interface ISection extends Document {
  courseId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  name: string;
  term: string;
  schedule: IScheduleItem[];
  maxStudents: number;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleItemSchema = new Schema<IScheduleItem>({
  dayOfWeek: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String, required: true },
}, { _id: false });

const SectionSchema = new Schema<ISection>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  term: { type: String, required: true },
  schedule: { type: [ScheduleItemSchema], required: true },
  maxStudents: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['planned', 'ongoing', 'completed', 'cancelled'], default: 'planned' },
}, { timestamps: true });

export default mongoose.model<ISection>('Section', SectionSchema);