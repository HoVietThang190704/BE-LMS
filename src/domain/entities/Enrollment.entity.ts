export interface IEnrollmentEntity {
  _id?: string;
  userId: string;
  courseId: string;
  sectionId?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  enrolledAt: Date;
}

export class EnrollmentEntity implements IEnrollmentEntity {
  constructor(
    public userId: string,
    public courseId: string,
    public sectionId: string | null = null,
    public status: 'pending' | 'approved' | 'rejected' = 'approved',
    public enrolledAt: Date = new Date(),
    public _id?: string
  ) {}
}
