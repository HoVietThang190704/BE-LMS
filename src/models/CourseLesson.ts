import mongoose, { Document, Schema } from 'mongoose';

export type ResourceType = 'link' | 'file';

export interface ICourseResource {
  name: string;
  type: ResourceType;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface ICourseLesson extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  week: number;
  order: number;
  durationMinutes?: number;
  resources: ICourseResource[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<ICourseResource>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['link', 'file'], required: true },
    url: { type: String, required: true, trim: true },
    size: { type: Number },
    mimeType: { type: String },
  },
  { _id: false }
);

const CourseLessonSchema = new Schema<ICourseLesson>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    week: { type: Number, required: true, min: 1, index: true },
    order: { type: Number, default: 0 },
    durationMinutes: { type: Number },
    resources: { type: [ResourceSchema], default: [] },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CourseLessonSchema.index({ courseId: 1, week: 1, order: 1 });

export default mongoose.model<ICourseLesson>('CourseLesson', CourseLessonSchema);
