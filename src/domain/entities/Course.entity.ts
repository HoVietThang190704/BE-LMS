// src/domain/entities/Course.entity.ts

// 1. Định nghĩa Interface (để dùng cho Mongoose và các nơi khác)
export interface ICourse {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  ownerId: string;
  tags?: string[];
  status: 'active' | 'archived';
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
    public tags?: string[],
    public status: 'active' | 'archived' = 'active',
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}
}