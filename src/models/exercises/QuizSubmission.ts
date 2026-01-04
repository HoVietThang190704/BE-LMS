import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface IQuizSubmission extends Document {
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: IQuizAnswer[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  startedAt: Date;
  submittedAt: Date;
  timeSpent: number; 
  createdAt: Date;
  updatedAt: Date;
}

const QuizAnswerSchema = new Schema<IQuizAnswer>({
  questionId: { type: String, required: true },
  selectedOptionId: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  pointsEarned: { type: Number, required: true, default: 0 }
}, { _id: false });

const QuizSubmissionSchema = new Schema<IQuizSubmission>({
  quizId: { 
    type: Schema.Types.ObjectId, 
    ref: 'QuizExercise', 
    required: true,
    index: true
  },
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  answers: {
    type: [QuizAnswerSchema],
    required: true,
    default: []
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
  attemptNumber: { 
    type: Number, 
    required: true, 
    default: 1 
  },
  startedAt: { 
    type: Date, 
    required: true 
  },
  submittedAt: { 
    type: Date, 
    required: true 
  },
  timeSpent: { 
    type: Number, 
    required: true, 
    default: 0 
  }
}, { timestamps: true });

QuizSubmissionSchema.index({ quizId: 1, studentId: 1 });
QuizSubmissionSchema.index({ studentId: 1, submittedAt: -1 });

export default mongoose.model<IQuizSubmission>('QuizSubmission', QuizSubmissionSchema);
