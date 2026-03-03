import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAttendanceDto } from '../dto/create-attendance.dto';
import { BulkAttendanceDto } from '../dto/bulk-attendance.dto';
import { AttendanceStatus, EnrollmentStatus, UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface AttendanceWithRelations {
  id: number;
  studentId: number;
  classId: number;
  enrollmentId: number;
  date: Date;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  class?: {
    id: number;
    name: string;
    subject: string;
  };
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: CreateAttendanceDto,
    teacherId: number,
  ): Promise<AttendanceWithRelations> {
    await this.validateTeacherClassAssignment(teacherId, data.classId);

    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: data.studentId },
    });

    if (!studentProfile) {
      throw new NotFoundException('Student not found');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: studentProfile.id,
        classId: data.classId,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(
        'No active enrollment found for this student in this class',
      );
    }

    if (enrollment.subscriptionEnd < new Date()) {
      throw new BadRequestException(
        'Student subscription has expired. Please renew enrollment.',
      );
    }

    const attendanceDate = new Date(data.date);

    try {
      const attendance = await this.prisma.attendance.create({
        data: {
          studentId: data.studentId,
          classId: data.classId,
          enrollmentId: enrollment.id,
          date: attendanceDate,
          status: data.status,
          notes: data.notes,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              subject: true,
            },
          },
        },
      });

      return attendance;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Attendance record already exists for this student on this date',
          );
        }
      }
      throw error;
    }
  }

  async bulkCreate(
    data: BulkAttendanceDto,
    teacherId: number,
  ): Promise<AttendanceWithRelations[]> {
    await this.validateTeacherClassAssignment(teacherId, data.classId);

    const attendanceDate = new Date(data.date);
    const classItem = await this.prisma.class.findUnique({
      where: { id: data.classId },
      include: {
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
        },
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class not found');
    }

    const validEnrollments = classItem.enrollments.filter(
      (enrollment) => enrollment.subscriptionEnd >= new Date(),
    );

    const enrollmentMap = new Map(
      validEnrollments.map((e) => [e.studentId, e]),
    );

    const results: AttendanceWithRelations[] = [];

    for (const item of data.attendances) {
      const enrollment = enrollmentMap.get(item.studentId);

      if (!enrollment) {
        throw new BadRequestException(
          `No active enrollment found for student ${item.studentId}`,
        );
      }

      try {
        const attendance = await this.prisma.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: item.studentId,
              classId: data.classId,
              date: attendanceDate,
            },
          },
          update: {
            status: item.status,
            notes: item.notes,
          },
          create: {
            studentId: item.studentId,
            classId: data.classId,
            enrollmentId: enrollment.id,
            date: attendanceDate,
            status: item.status,
            notes: item.notes,
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            class: {
              select: {
                id: true,
                name: true,
                subject: true,
              },
            },
          },
        });

        results.push(attendance);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        throw new BadRequestException(
          `Failed to create attendance for student ${item.studentId}: ${message}`,
        );
      }
    }

    return results;
  }

  async findByClassAndDate(
    classId: number,
    date: string,
    teacherId: number,
  ): Promise<AttendanceWithRelations[]> {
    await this.validateTeacherClassAssignment(teacherId, classId);

    const attendanceDate = new Date(date);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        classId,
        date: attendanceDate,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
      orderBy: {
        student: {
          firstName: 'asc',
        },
      },
    });

    return attendances;
  }

  async findByStudent(
    studentId: number,
    userId: number,
    userRole: UserRole,
  ): Promise<AttendanceWithRelations[]> {
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.prisma.teacherProfile.findUnique({
        where: { userId },
      });

      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found');
      }
    } else if (userRole === UserRole.PARENT) {
      const parentLink = await this.prisma.parentStudentLink.findFirst({
        where: {
          parentId: userId,
          studentId,
        },
      });

      if (!parentLink) {
        throw new ForbiddenException(
          'You are not authorized to view this student attendance',
        );
      }
    }

    const attendances = await this.prisma.attendance.findMany({
      where: {
        studentId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return attendances;
  }

  async findOne(id: number): Promise<AttendanceWithRelations> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  private async validateTeacherClassAssignment(
    teacherId: number,
    classId: number,
  ): Promise<void> {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classItem) {
      throw new NotFoundException('Class not found');
    }

    if (classItem.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You are not authorized to manage attendance for this class',
      );
    }
  }
}
