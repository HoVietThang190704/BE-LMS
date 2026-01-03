import mongoose, { Schema, Document } from 'mongoose';

export interface IExam extends Document {
  exam_id?: string;
  courseId: mongoose.Types.ObjectId;
  title: string;
  order: number;
  description: string;
  correct_answer: string | number;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>({
  exam_id: { 
    type: String, 
    unique: true, 
    sparse: true, 
    index: true,
    trim: true
  },
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true,
    index: true
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  order: { 
    type: Number, 
    required: true,
    index: true
  },
  description: { 
    type: String, 
    required: true
  },
  correct_answer: { 
    type: Schema.Types.Mixed, 
    required: true
  }
}, { timestamps: true });

ExamSchema.index({ title: 'text', description: 'text' });
ExamSchema.index({ courseId: 1, order: 1 });

export default mongoose.model<IExam>('Exam', ExamSchema);
