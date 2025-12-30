import mongoose, { Schema, Document } from 'mongoose';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  visible?: boolean;
  explanation?: string;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface ExerciseDocument extends Document {
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  template?: string;
  testCases: TestCase[];
  constraints?: string;
  examples?: Example[];
  timeLimit?: number;
  memoryLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema: Schema = new Schema({
  id: { type: String, required: true },
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  visible: { type: Boolean, default: false },
  explanation: { type: String }
}, { _id: false });

const ExampleSchema: Schema = new Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
}, { _id: false });

const ExerciseSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  language: { type: String, required: true, default: 'python' },
  template: { type: String },
  testCases: { type: [TestCaseSchema], default: [] },
  constraints: { type: String },
  examples: { type: [ExampleSchema], default: [] },
  timeLimit: { type: Number, default: 10000 },
  memoryLimit: { type: Number, default: 256000 }
}, { timestamps: true });

ExerciseSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<ExerciseDocument>('Exercise', ExerciseSchema);
