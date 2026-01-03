import mongoose, { Schema, Document } from 'mongoose';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  visible?: boolean;
}

export interface IExerciseProblem extends Document {
  exercise_id?: string;
  courseId: mongoose.Types.ObjectId;
  title: string;
  order: number;
  description: string;
  temp_code: string;
  testcase: ITestCase[];
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  visible: { type: Boolean, default: false }
}, { _id: false });

const ExerciseProblemSchema = new Schema<IExerciseProblem>({
  exercise_id: { 
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
  temp_code: { 
    type: String, 
    required: true
  },
  testcase: {
    type: [TestCaseSchema],
    required: true,
    default: []
  }
}, { timestamps: true });

ExerciseProblemSchema.index({ title: 'text', description: 'text' });
ExerciseProblemSchema.index({ courseId: 1, order: 1 });

export default mongoose.model<IExerciseProblem>('ExerciseProblem', ExerciseProblemSchema);
