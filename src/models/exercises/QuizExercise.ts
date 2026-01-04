import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface IQuizQuestion {
  id: string;
  question: string;
  options: IQuizOption[];
  explanation?: string;
  points: number;
}

export interface IQuizExercise extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  questions: IQuizQuestion[];
  timeLimit?: number; 
  passingScore: number; 
  allowRetake: boolean;
  maxAttempts?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsImmediately: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizOptionSchema = new Schema<IQuizOption>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false }
}, { _id: false });

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  id: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [QuizOptionSchema], required: true, default: [] },
  explanation: { type: String },
  points: { type: Number, required: true, default: 1 }
}, { _id: false });

const QuizExerciseSchema = new Schema<IQuizExercise>({
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
    trim: true
  },
  order: { 
    type: Number, 
    required: true,
    index: true
  },
  questions: {
    type: [QuizQuestionSchema],
    required: true,
    default: []
  },
  timeLimit: { 
    type: Number,
    min: 1
  },
  passingScore: { 
    type: Number, 
    required: true, 
    default: 60,
    min: 0,
    max: 100
  },
  allowRetake: { 
    type: Boolean, 
    default: true 
  },
  maxAttempts: { 
    type: Number,
    min: 1
  },
  shuffleQuestions: { 
    type: Boolean, 
    default: false 
  },
  shuffleOptions: { 
    type: Boolean, 
    default: false 
  },
  showResultsImmediately: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

QuizExerciseSchema.index({ title: 'text', description: 'text' }, { language_override: 'none', default_language: 'none' });
QuizExerciseSchema.index({ courseId: 1, order: 1 });

export default mongoose.model<IQuizExercise>('QuizExercise', QuizExerciseSchema);
