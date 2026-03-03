import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import { EnrollmentStatus, UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface EnrollmentWithRelations {
  id: number;
  studentId: number;
  classId: number;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  amountPaid: number;
  status: EnrollmentStatus;
  paymentConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: number;
    userId: number;
    user?: { id: number; firstName: string; lastName: string; email: string };
  };
  class?: {
    id: number;
    name: string;
    subject: string;
    maxCapacity: number;
    currentCapacity: number;
  };
}

export interface PaginatedEnrollments {
  data: EnrollmentWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEnrollmentDto): Promise<EnrollmentWithRelations> {
    const student = await this.prisma.user.findFirst({
      where: { id: data.studentId, role: UserRole.STUDENT, isActive: true },
      include: { studentProfile: true },
    });

    if (!student || !student.studentProfile) {
      throw new NotFoundException('Student not found or not active');
    }

    const classItem = await this.prisma.class.findUnique({
      where: { id: data.classId },
    });

    if (!classItem) {
      throw new NotFoundException('Class not found');
    }

    if (!classItem.isActive) {
      throw new BadRequestException('Class is not active');
    }

    if (classItem.currentCapacity >= classItem.maxCapacity) {
      throw new BadRequestException('Class is at full capacity');
    }

    const defaultSubscriptionDays = 30;
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(
      subscriptionEnd.getDate() + defaultSubscriptionDays,
    );

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          studentId: student.studentProfile.id,
          classId: data.classId,
          amountPaid: data.amountPaid,
          subscriptionEnd,
          status: EnrollmentStatus.ACTIVE,
          paymentConfirmed: false,
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
              maxCapacity: true,
              currentCapacity: true,
            },
          },
        },
      });

      await this.prisma.class.update({
        where: { id: data.classId },
        data: { currentCapacity: { increment: 1 } },
      });

      return enrollment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Student is already enrolled in this class',
          );
        }
      }
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    studentId?: number,
    classId?: number,
    status?: EnrollmentStatus,
  ): Promise<PaginatedEnrollments> {
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (classId) {
      where.classId = classId;
    }

    if (status) {
      where.status = status;
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
              maxCapacity: true,
              currentCapacity: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<EnrollmentWithRelations> {
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
            maxCapacity: true,
            currentCapacity: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    return enrollment;
  }

  async update(
    id: number,
    data: UpdateEnrollmentDto,
  ): Promise<EnrollmentWithRelations> {
    await this.findOne(id);

    const updateData: Prisma.EnrollmentUpdateInput = {};

    if (data.paymentConfirmed !== undefined) {
      updateData.paymentConfirmed = data.paymentConfirmed;
    }

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.subscriptionEnd) {
      updateData.subscriptionEnd = new Date(data.subscriptionEnd);
    }

    const enrollment = await this.prisma.enrollment.update({
      where: { id },
      data: updateData,
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
            maxCapacity: true,
            currentCapacity: true,
          },
        },
      },
    });

    return enrollment;
  }

  async confirmPayment(
    id: number,
    days: number = 30,
  ): Promise<EnrollmentWithRelations> {
    const enrollment = await this.findOne(id);

    if (enrollment.paymentConfirmed) {
      throw new BadRequestException('Payment already confirmed');
    }

    const subscriptionStart = new Date();
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + days);

    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id },
      data: {
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
            maxCapacity: true,
            currentCapacity: true,
          },
        },
      },
    });

    return updatedEnrollment;
  }

  async cancel(id: number): Promise<{ message: string }> {
    const enrollment = await this.findOne(id);

    await this.prisma.enrollment.update({
      where: { id },
      data: { status: EnrollmentStatus.CANCELLED },
    });

    await this.prisma.class.update({
      where: { id: enrollment.classId },
      data: { currentCapacity: { decrement: 1 } },
    });

    return { message: `Enrollment with ID ${id} has been cancelled` };
  }
}
