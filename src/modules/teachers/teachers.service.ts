import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createTeacherDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: createTeacherDto.email,
        password: createTeacherDto.password,
        role: UserRole.TEACHER,
        firstName: createTeacherDto.firstName,
        lastName: createTeacherDto.lastName,
        phone: createTeacherDto.phone,
      },
    });

    await this.prisma.teacherProfile.create({
      data: {
        userId: user.id,
        specialization: createTeacherDto.specialization,
      },
    });

    return this.findOne(user.id);
  }

  async findAll(page: number = 1, limit: number = 10, isActive?: boolean) {
    const skip = (page - 1) * limit;

    const teacherProfileCondition: Record<string, unknown> = {
      isNot: null,
    };
    if (isActive !== undefined) {
      teacherProfileCondition.isActive = isActive;
    }

    const where = {
      // teacherProfile: teacherProfileCondition,
      role: UserRole.TEACHER,
    };

    const [teachers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          teacherProfile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: teachers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const teacher = await this.prisma.user.findUnique({
      where: { id, role: UserRole.TEACHER },
      // next time 
      // include: {
      //   teacherProfile: true,
      // },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async update(id: number, updateTeacherDto: UpdateTeacherDto) {
    await this.findOne(id);

    const updateData: Partial<User> = {};

    if (updateTeacherDto.firstName) {
      updateData.firstName = updateTeacherDto.firstName;
    }
    if (updateTeacherDto.lastName) {
      updateData.lastName = updateTeacherDto.lastName;
    }
    if (updateTeacherDto.phone !== undefined) {
      updateData.phone = updateTeacherDto.phone;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
    }

    if (updateTeacherDto.specialization !== undefined) {
      await this.prisma.teacherProfile.update({
        where: { userId: id },
        data: { specialization: updateTeacherDto.specialization },
      });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.teacherProfile.update({
      where: { userId: id },
      data: { isActive: false },
    });

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Teacher deactivated successfully' };
  }
}
