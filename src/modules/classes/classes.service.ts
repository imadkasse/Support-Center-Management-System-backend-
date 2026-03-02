import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Prisma } from '@prisma/client';

export interface ClassWithRelations {
  id: number;
  name: string;
  subject: string;
  roomId: number;
  teacherId: number;
  schedule: string;
  maxCapacity: number;
  currentCapacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  room?: { id: number; name: string; capacity: number };
  teacher?: { id: number; firstName: string; lastName: string; email: string };
  _count?: { enrollments: number };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto): Promise<ClassWithRelations> {
    await this.validateClassCreation(createClassDto);

    const createdClass = await this.prisma.class.create({
      data: {
        name: createClassDto.name,
        subject: createClassDto.subject,
        roomId: createClassDto.roomId,
        teacherId: createClassDto.teacherId,
        schedule: createClassDto.schedule,
        maxCapacity: createClassDto.maxCapacity,
        currentCapacity: 0,
        isActive: true,
      },
      include: {
        room: { select: { id: true, name: true, capacity: true } },
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return this.addOccupancyPercentage(createdClass);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ): Promise<PaginatedResult<ClassWithRelations>> {
    const skip = (page - 1) * limit;
    const where: Prisma.ClassWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take: limit,
        include: {
          room: { select: { id: true, name: true, capacity: true } },
          teacher: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.class.count({ where }),
    ]);

    const classesWithOccupancy = data.map((c) =>
      this.addOccupancyPercentage(c),
    );

    return {
      data: classesWithOccupancy,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<ClassWithRelations> {
    const classItem = await this.prisma.class.findUnique({
      where: { id },
      include: {
        room: { select: { id: true, name: true, capacity: true } },
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!classItem) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return this.addOccupancyPercentage(classItem);
  }

  async update(
    id: number,
    updateClassDto: UpdateClassDto,
  ): Promise<ClassWithRelations> {
    const existingClass = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    if (updateClassDto.roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: updateClassDto.roomId },
      });
      if (!room) {
        throw new BadRequestException(
          `Room with ID ${updateClassDto.roomId} not found`,
        );
      }
    }

    if (updateClassDto.teacherId) {
      const teacher = await this.prisma.user.findFirst({
        where: { id: updateClassDto.teacherId, role: 'TEACHER' },
      });
      if (!teacher) {
        throw new BadRequestException(
          `Teacher with ID ${updateClassDto.teacherId} not found or is not a TEACHER`,
        );
      }
    }

    if (updateClassDto.schedule) {
      this.validateSchedule(updateClassDto.schedule);
    }

    const updatedClass = await this.prisma.class.update({
      where: { id },
      data: updateClassDto,
      include: {
        room: { select: { id: true, name: true, capacity: true } },
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { enrollments: true } },
      },
    });

    return this.addOccupancyPercentage(updatedClass);
  }

  async remove(id: number): Promise<{ message: string }> {
    const existingClass = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    await this.prisma.class.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: `Class with ID ${id} has been soft deleted` };
  }

  private async validateClassCreation(
    createClassDto: CreateClassDto,
  ): Promise<void> {
    const room = await this.prisma.room.findUnique({
      where: { id: createClassDto.roomId },
    });
    if (!room) {
      throw new BadRequestException(
        `Room with ID ${createClassDto.roomId} not found`,
      );
    }

    const teacher = await this.prisma.user.findFirst({
      where: { id: createClassDto.teacherId, role: 'TEACHER' },
    });
    if (!teacher) {
      throw new BadRequestException(
        `Teacher with ID ${createClassDto.teacherId} not found or is not a TEACHER`,
      );
    }

    this.validateSchedule(createClassDto.schedule);
  }

  private validateSchedule(schedule: string): void {
    interface ScheduleData {
      day: string;
      startTime: string;
      endTime: string;
    }

    try {
      const parsed = JSON.parse(schedule) as ScheduleData;
      const validDays = [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ];
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

      if (!parsed.day || !validDays.includes(parsed.day)) {
        throw new BadRequestException('Invalid day. Must be MONDAY-SUNDAY');
      }
      if (!parsed.startTime || !timeRegex.test(parsed.startTime)) {
        throw new BadRequestException(
          'Invalid startTime. Must be in HH:MM format',
        );
      }
      if (!parsed.endTime || !timeRegex.test(parsed.endTime)) {
        throw new BadRequestException(
          'Invalid endTime. Must be in HH:MM format',
        );
      }

      const [startHour, startMin] = parsed.startTime.split(':').map(Number);
      const [endHour, endMin] = parsed.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        throw new BadRequestException('endTime must be after startTime');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Invalid schedule format. Must be valid JSON',
      );
    }
  }

  private addOccupancyPercentage<T extends ClassWithRelations>(
    classItem: T,
  ): T & { occupancyPercentage: number } {
    const occupancyPercentage =
      classItem.maxCapacity > 0
        ? (classItem.currentCapacity / classItem.maxCapacity) * 100
        : 0;
    return {
      ...classItem,
      occupancyPercentage: Math.round(occupancyPercentage * 100) / 100,
    };
  }
}
