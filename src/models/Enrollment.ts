import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  enrolledAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
  enrolledAt: { type: Date, default: Date.now },
});

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
