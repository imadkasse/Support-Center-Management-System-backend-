import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EnrollmentStatus, UserRole } from '@prisma/client';

export interface EnrolledClass {
  id: number;
  name: string;
  subject: string;
  schedule: string;
  roomId: number;
  teacherId: number;
  maxCapacity: number;
  currentCapacity: number;
  isActive: boolean;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  amountPaid: number;
  status: EnrollmentStatus;
  paymentConfirmed: boolean;
}

export interface WeeklySchedule {
  day: string;
  startTime: string;
  endTime: string;
  className: string;
  subject: string;
}

export interface SubscriptionStatus {
  classId: number;
  className: string;
  status: EnrollmentStatus;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  paymentConfirmed: boolean;
}

export interface DaysRemaining {
  classId: number;
  className: string;
  daysRemaining: number;
  subscriptionEnd: Date;
}

export interface LinkedStudentAttendance {
  studentId: number;
  studentName: string;
  attendance: {
    date: Date;
    status: string;
    className: string;
  }[];
}

export interface LinkedStudentSubscription {
  studentId: number;
  studentName: string;
  subscriptions: SubscriptionStatus[];
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getTotalActiveStudents(): Promise<number> {
    return this.prisma.user.count({
      where: {
        role: UserRole.STUDENT,
        isActive: true,
      },
    });
  }

  async getTotalEnrolledStudents(): Promise<number> {
    const studentsWithActiveEnrollment = await this.prisma.enrollment.findMany({
      where: {
        status: EnrollmentStatus.ACTIVE,
      },
      select: {
        studentId: true,
      },
      distinct: ['studentId'],
    });
    return studentsWithActiveEnrollment.length;
  }

  async getActiveClasses(): Promise<number> {
    return this.prisma.class.count({
      where: {
        isActive: true,
      },
    });
  }

  async getFullCapacityClasses(): Promise<number> {
    return this.prisma.class.count({
      where: {
        currentCapacity: {
          gte: undefined,
        },
      },
    });
  }

  async getFullCapacityClassesCorrect(): Promise<number> {
    const classes = await this.prisma.class.findMany({
      where: {
        isActive: true,
      },
    });
    return classes.filter((c) => c.currentCapacity >= c.maxCapacity).length;
  }

  async getExpiredSubscriptions(): Promise<number> {
    return this.prisma.enrollment.count({
      where: {
        status: EnrollmentStatus.EXPIRED,
      },
    });
  }

  async getMonthlyRevenue(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const result = await this.prisma.enrollment.aggregate({
      where: {
        paymentConfirmed: true,
        subscriptionStart: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amountPaid: true,
      },
    });

    return result._sum.amountPaid || 0;
  }

  async getAdminStats() {
    const [
      totalActiveStudents,
      totalEnrolledStudents,
      activeClasses,
      fullCapacityClasses,
      expiredSubscriptions,
      monthlyRevenue,
    ] = await Promise.all([
      this.getTotalActiveStudents(),
      this.getTotalEnrolledStudents(),
      this.getActiveClasses(),
      this.getFullCapacityClassesCorrect(),
      this.getExpiredSubscriptions(),
      this.getMonthlyRevenue(),
    ]);

    return {
      totalActiveStudents,
      totalEnrolledStudents,
      activeClasses,
      fullCapacityClasses,
      expiredSubscriptions,
      monthlyRevenue,
    };
  }

  async getStudentEnrolledClasses(studentId: number): Promise<EnrolledClass[]> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        class: true,
      },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.class.id,
      name: enrollment.class.name,
      subject: enrollment.class.subject,
      schedule: enrollment.class.schedule,
      roomId: enrollment.class.roomId,
      teacherId: enrollment.class.teacherId,
      maxCapacity: enrollment.class.maxCapacity,
      currentCapacity: enrollment.class.currentCapacity,
      isActive: enrollment.class.isActive,
      subscriptionStart: enrollment.subscriptionStart,
      subscriptionEnd: enrollment.subscriptionEnd,
      amountPaid: enrollment.amountPaid,
      status: enrollment.status,
      paymentConfirmed: enrollment.paymentConfirmed,
    }));
  }

  async getStudentWeeklySchedule(studentId: number): Promise<WeeklySchedule[]> {
    const enrolledClasses = await this.getStudentEnrolledClasses(studentId);
    const schedule: WeeklySchedule[] = [];

    for (const cls of enrolledClasses) {
      try {
        const scheduleData = JSON.parse(cls.schedule) as
          | { day: string; startTime: string; endTime: string }
          | { day: string; startTime: string; endTime: string }[];
        const scheduleArray = Array.isArray(scheduleData)
          ? scheduleData
          : [scheduleData];

        for (const item of scheduleArray) {
          schedule.push({
            day: item.day,
            startTime: item.startTime,
            endTime: item.endTime,
            className: cls.name,
            subject: cls.subject,
          });
        }
      } catch {
        continue;
      }
    }

    return schedule.sort((a, b) => {
      const days = [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ];
      return days.indexOf(a.day) - days.indexOf(b.day);
    });
  }

  async getStudentSubscriptionStatus(
    studentId: number,
  ): Promise<SubscriptionStatus[]> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        class: true,
      },
    });

    return enrollments.map((enrollment) => ({
      classId: enrollment.classId,
      className: enrollment.class.name,
      status: enrollment.status,
      subscriptionStart: enrollment.subscriptionStart,
      subscriptionEnd: enrollment.subscriptionEnd,
      paymentConfirmed: enrollment.paymentConfirmed,
    }));
  }

  async getStudentDaysRemaining(studentId: number): Promise<DaysRemaining[]> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        class: true,
      },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return enrollments.map((enrollment) => {
      const endDate = new Date(enrollment.subscriptionEnd);
      endDate.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        classId: enrollment.classId,
        className: enrollment.class.name,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        subscriptionEnd: enrollment.subscriptionEnd,
      };
    });
  }

  async getLinkedStudentsAttendance(
    parentId: number,
  ): Promise<LinkedStudentAttendance[]> {
    const links = await this.prisma.parentStudentLink.findMany({
      where: {
        parentId,
      },
      select: {
        studentId: true,
      },
    });

    if (links.length === 0) {
      throw new NotFoundException('No linked students found');
    }

    const studentIds = links.map((link) => link.studentId);

    const students = await this.prisma.user.findMany({
      where: {
        id: { in: studentIds },
      },
      include: {
        studentProfile: true,
      },
    });

    const result: LinkedStudentAttendance[] = [];

    for (const student of students) {
      if (!student.studentProfile) continue;

      const attendances = await this.prisma.attendance.findMany({
        where: {
          studentId: student.id,
        },
        include: {
          class: true,
        },
        orderBy: {
          date: 'desc',
        },
        take: 30,
      });

      result.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        attendance: attendances.map((att) => ({
          date: att.date,
          status: att.status,
          className: att.class.name,
        })),
      });
    }

    return result;
  }

  async getLinkedStudentsSubscriptionStatus(
    parentId: number,
  ): Promise<LinkedStudentSubscription[]> {
    const links = await this.prisma.parentStudentLink.findMany({
      where: {
        parentId,
      },
      select: {
        studentId: true,
      },
    });

    if (links.length === 0) {
      throw new NotFoundException('No linked students found');
    }

    const studentIds = links.map((link) => link.studentId);

    const students = await this.prisma.user.findMany({
      where: {
        id: { in: studentIds },
      },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    return students
      .filter((s) => s.studentProfile)
      .map((student) => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        subscriptions: student.studentProfile!.enrollments.map(
          (enrollment) => ({
            classId: enrollment.classId,
            className: enrollment.class.name,
            status: enrollment.status,
            subscriptionStart: enrollment.subscriptionStart,
            subscriptionEnd: enrollment.subscriptionEnd,
            paymentConfirmed: enrollment.paymentConfirmed,
          }),
        ),
      }));
  }
}
