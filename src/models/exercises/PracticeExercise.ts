import mongoose, { Schema, Document } from 'mongoose';

export interface IPracticeTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
  points: number;
}

export interface IPracticeExercise extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  templateCode: string;
  testCases: IPracticeTestCase[];
  constraints?: string;
  hints?: string[];
  sampleInput?: string;
  sampleOutput?: string;
  timeLimit: number; 
  memoryLimit: number; 
  createdAt: Date;
  updatedAt: Date;
}

const PracticeTestCaseSchema = new Schema<IPracticeTestCase>({
  id: { type: String, required: true },
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  explanation: { type: String },
  points: { type: Number, required: true, default: 10 }
}, { _id: false });

const PracticeExerciseSchema = new Schema<IPracticeExercise>({
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
  description: { 
    type: String, 
    required: true
  },
  order: { 
    type: Number, 
    required: true,
    index: true
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'easy' 
  },
  language: { 
    type: String, 
    required: true, 
    default: 'python' 
  },
  templateCode: { 
    type: String, 
    required: true,
    default: ''
  },
  testCases: {
    type: [PracticeTestCaseSchema],
    required: true,
    default: []
  },
  constraints: { 
    type: String 
  },
  hints: { 
    type: [String], 
    default: [] 
  },
  sampleInput: { 
    type: String 
  },
  sampleOutput: { 
    type: String 
  },
  timeLimit: { 
    type: Number, 
    default: 10000 
  },
  memoryLimit: { 
    type: Number, 
    default: 256000 
  }
}, { timestamps: true });
PracticeExerciseSchema.index({ title: 'text', description: 'text' }, { language_override: 'none', default_language: 'none' });
PracticeExerciseSchema.index({ courseId: 1, order: 1 });

export default mongoose.model<IPracticeExercise>('PracticeExercise', PracticeExerciseSchema);
