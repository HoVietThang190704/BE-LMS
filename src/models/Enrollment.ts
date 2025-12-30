import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId | null;
  enrolledAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section', default: null },
  enrolledAt: { type: Date, default: Date.now },
});

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ sectionId: 1, userId: 1 });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
