export interface IEnrollmentEntity {
  _id?: string;
  userId: string;
  courseId: string;
  sectionId?: string | null;
  enrolledAt: Date;
}

export class EnrollmentEntity implements IEnrollmentEntity {
  constructor(
    public userId: string,
    public courseId: string,
    public sectionId: string | null = null,
    public enrolledAt: Date = new Date(),
    public _id?: string
  ) {}
}
