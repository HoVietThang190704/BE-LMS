import mongoose, { Schema, Document } from 'mongoose';

export interface IPracticeTestResult {
  testCaseId: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  executionTime?: number;
  error?: string;
  pointsEarned: number;
  isHidden?: boolean;
}

export interface IPracticeSubmission extends Document {
  practiceId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  code: string;
  language: string;
  testResults: IPracticeTestResult[];
  passedTests: number;
  totalTests: number;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  executionTime?: number;
  memoryUsed?: number;
  error?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PracticeTestResultSchema = new Schema<IPracticeTestResult>({
  testCaseId: { type: String, required: true },
  passed: { type: Boolean, required: true },
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  actualOutput: { type: String, required: true },
  executionTime: { type: Number },
  error: { type: String },
  pointsEarned: { type: Number, required: true, default: 0 },
  isHidden: { type: Boolean, default: false }
}, { _id: false });

const PracticeSubmissionSchema = new Schema<IPracticeSubmission>({
  practiceId: { 
    type: Schema.Types.ObjectId, 
    ref: 'PracticeExercise', 
    required: true,
    index: true
  },
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  code: { 
    type: String, 
    required: true 
  },
  language: { 
    type: String, 
    required: true 
  },
  testResults: {
    type: [PracticeTestResultSchema],
    required: true,
    default: []
  },
  passedTests: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  totalTests: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  score: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  totalPoints: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  percentage: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  passed: { 
    type: Boolean, 
    required: true, 
    default: false 
  },
  executionTime: { 
    type: Number 
  },
  memoryUsed: { 
    type: Number 
  },
  error: { 
    type: String 
  },
  submittedAt: { 
    type: Date, 
    required: true,
    default: Date.now
  }
}, { timestamps: true });

PracticeSubmissionSchema.index({ practiceId: 1, studentId: 1 });
PracticeSubmissionSchema.index({ studentId: 1, submittedAt: -1 });

export default mongoose.model<IPracticeSubmission>('PracticeSubmission', PracticeSubmissionSchema);
