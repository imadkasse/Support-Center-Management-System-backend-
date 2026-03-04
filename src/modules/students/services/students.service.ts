import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';


@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createStudentDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
    // hash password before saving to database
    const hashedPassword = await bcrypt.hash(createStudentDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: createStudentDto.email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        firstName: createStudentDto.firstName,
        lastName: createStudentDto.lastName,
        phone: createStudentDto.phone,
      },
    });

    await this.prisma.studentProfile.create({
      data: {
        userId: user.id,
        dateOfBirth: createStudentDto.dateOfBirth
          ? new Date(createStudentDto.dateOfBirth)
          : undefined,
        address: createStudentDto.address,
        emergencyContact: createStudentDto.emergencyContact,
      },
    });

    return this.findOne(user.id);
  }

  async findAll(page: number = 1, limit: number = 10, isActive?: boolean) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      role: UserRole.STUDENT,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [students, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const student = await this.prisma.user.findUnique({
      where: { id },
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

    if (!student || student.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    await this.findOne(id);

    const updateData: Partial<User> = {};

    if (updateStudentDto.firstName) {
      updateData.firstName = updateStudentDto.firstName;
    }
    if (updateStudentDto.lastName) {
      updateData.lastName = updateStudentDto.lastName;
    }
    if (updateStudentDto.phone !== undefined) {
      updateData.phone = updateStudentDto.phone;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
    }

    const profileData: Record<string, unknown> = {};

    if (updateStudentDto.dateOfBirth !== undefined) {
      profileData.dateOfBirth = updateStudentDto.dateOfBirth
        ? new Date(updateStudentDto.dateOfBirth)
        : null;
    }
    if (updateStudentDto.address !== undefined) {
      profileData.address = updateStudentDto.address;
    }
    if (updateStudentDto.emergencyContact !== undefined) {
      profileData.emergencyContact = updateStudentDto.emergencyContact;
    }

    if (Object.keys(profileData).length > 0) {
      await this.prisma.studentProfile.update({
        where: { userId: id },
        data: profileData,
      });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Student deactivated successfully' };
  }

  async reactivate(id: number) {
    const student = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!student || student.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return this.findOne(id);
  }
}
