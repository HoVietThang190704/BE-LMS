// src/domain/entities/Course.entity.ts

// 1. Định nghĩa Interface (để dùng cho Mongoose và các nơi khác)
export interface ISyllabusItem {
  title: string;
  description?: string;
}

export interface ICourse {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  image?: string;
  ownerId: string;
  tags?: string[];
  status: 'active' | 'archived';
  visibility: 'public' | 'private';
  requireApproval: boolean;
  invitationCode?: string;
  credits?: number;
  instructor?: string;
  schedule?: string;
  room?: string;
  enrolled?: number;
  capacity?: number;
  syllabus?: ISyllabusItem[];
  isEnrolled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Định nghĩa Class (để dùng cho logic nghiệp vụ - Use Cases)
export class Course implements ICourse {
  constructor(
    public code: string,
    public name: string,
    public ownerId: string,
    public _id?: string,
    public description?: string,
    public image?: string,
    public tags?: string[],
    public status: 'active' | 'archived' = 'active',
    public visibility: 'public' | 'private' = 'public',
    public requireApproval: boolean = false,
    public invitationCode?: string,
    public credits?: number,
    public instructor?: string,
    public schedule?: string,
    public room?: string,
    public enrolled?: number,
    public capacity?: number,
    public syllabus?: ISyllabusItem[],
    public isEnrolled?: boolean,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}
}