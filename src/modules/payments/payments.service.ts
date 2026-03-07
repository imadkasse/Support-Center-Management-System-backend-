import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { EnrollmentStatus, UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface PaymentInfo {
  id: number;
  studentId: number;
  classId: number;
  amountPaid: number;
  paymentConfirmed: boolean;
  subscriptionStart: Date | null;
  subscriptionEnd: Date | null;
  status: EnrollmentStatus;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: number;
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  class: {
    id: number;
    name: string;
    subject: string;
  };
}

export interface PaginatedPayments {
  data: PaymentInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPaymentsCount: number;
  totalEnrollments: number;
  confirmedPayments: number;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<PaginatedPayments> {
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {};

    if (status) {
      where.status = status as EnrollmentStatus;
    }

    const [data, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      data: data as PaymentInfo[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: number,
    user: { id: number; role: UserRole },
  ): Promise<PaymentInfo> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
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

    if (!enrollment) {
      throw new NotFoundException(`Payment/Enrollment with ID ${id} not found`);
    }

    if (user.role === UserRole.ADMIN) {
      return enrollment as PaymentInfo;
    }

    const studentUserId = enrollment.student.userId;

    const parentLink = await this.prisma.parentStudentLink.findFirst({
      where: {
        parentId: user.id,
        studentId: studentUserId,
      },
    });

    if (user.role === UserRole.STUDENT && studentUserId === user.id) {
      return enrollment as PaymentInfo;
    }

    if (user.role === UserRole.PARENT && parentLink) {
      return enrollment as PaymentInfo;
    }

    throw new ForbiddenException('You do not have access to this payment');
  }

  async findByStudent(
    studentId: number,
    user: { id: number; role: UserRole },
  ): Promise<PaymentInfo[]> {
    if (user.role === UserRole.ADMIN) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
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
        orderBy: { createdAt: 'desc' },
      });
      return enrollments as PaymentInfo[];
    }

    if (user.role === UserRole.TEACHER) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          studentId,
          class: {
            teacherId: user.id,
          },
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
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
        orderBy: { createdAt: 'desc' },
      });
      return enrollments as PaymentInfo[];
    }

    if (user.role === UserRole.PARENT) {
      const isParent = await this.prisma.parentStudentLink.findFirst({
        where: {
          parentId: user.id,
          studentId: studentId,
        },
      });

      if (!isParent) {
        throw new ForbiddenException('You are not linked to this student');
      }

      const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
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
        orderBy: { createdAt: 'desc' },
      });
      return enrollments as PaymentInfo[];
    }

    if (user.role === UserRole.STUDENT) {
      const student = await this.prisma.studentProfile.findFirst({
        where: { userId: user.id },
      });

      if (!student || student.id !== studentId) {
        throw new ForbiddenException(
          'You can only view your own payment history',
        );
      }

      const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
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
        orderBy: { createdAt: 'desc' },
      });
      return enrollments as PaymentInfo[];
    }

    throw new ForbiddenException(
      'You do not have access to this student payment history',
    );
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentInfo> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: createPaymentDto.studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const classItem = await this.prisma.class.findUnique({
      where: { id: createPaymentDto.classId },
    });

    if (!classItem) {
      throw new NotFoundException('Class not found');
    }

    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: createPaymentDto.studentId,
        classId: createPaymentDto.classId,
      },
    });

    if (existingEnrollment) {
      throw new BadRequestException(
        'Student is already enrolled in this class',
      );
    }

    if (classItem.currentCapacity >= classItem.maxCapacity) {
      throw new BadRequestException('Class is at full capacity');
    }

    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: createPaymentDto.studentId,
        classId: createPaymentDto.classId,
        amountPaid: createPaymentDto.amountPaid,
        paymentConfirmed: true,
        subscriptionStart,
        subscriptionEnd,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
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

    await this.prisma.class.update({
      where: { id: createPaymentDto.classId },
      data: { currentCapacity: { increment: 1 } },
    });

    return enrollment as PaymentInfo;
  }

  async recordPayment(
    recordPaymentDto: RecordPaymentDto,
  ): Promise<PaymentInfo> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: recordPaymentDto.enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const newAmountPaid = enrollment.amountPaid + recordPaymentDto.amountPaid;

    const subscriptionStart = enrollment.subscriptionStart || new Date();
    const subscriptionEnd = new Date(enrollment.subscriptionEnd || new Date());
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id: recordPaymentDto.enrollmentId },
      data: {
        amountPaid: newAmountPaid,
        paymentConfirmed: true,
        subscriptionStart,
        subscriptionEnd,
        status: EnrollmentStatus.ACTIVE,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
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

    return updatedEnrollment as PaymentInfo;
  }

  async getStats(): Promise<PaymentStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalRevenueResult,
      monthlyRevenueResult,
      pendingPayments,
      totalEnrollments,
      confirmedPayments,
    ] = await Promise.all([
      this.prisma.enrollment.aggregate({
        _sum: { amountPaid: true },
      }),
      this.prisma.enrollment.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amountPaid: true },
      }),
      this.prisma.enrollment.count({
        where: { paymentConfirmed: false },
      }),
      this.prisma.enrollment.count(),
      this.prisma.enrollment.count({
        where: { paymentConfirmed: true },
      }),
    ]);

    return {
      totalRevenue: totalRevenueResult._sum.amountPaid || 0,
      monthlyRevenue: monthlyRevenueResult._sum.amountPaid || 0,
      pendingPaymentsCount: pendingPayments,
      totalEnrollments,
      confirmedPayments,
    };
  }
}
