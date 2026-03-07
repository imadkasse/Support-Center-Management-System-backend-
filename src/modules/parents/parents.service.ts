import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  async create(createParentDto: CreateParentDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createParentDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
    // hash password before saving to database
    const hashedPassword = await bcrypt.hash(createParentDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: createParentDto.email,
        password: hashedPassword,
        role: UserRole.PARENT,
        firstName: createParentDto.firstName,
        lastName: createParentDto.lastName,
        phone: createParentDto.phone,
      },
    });

    return this.findOne(user.id);
  }

  async findAll(page: number = 1, limit: number = 10, isActive?: boolean) {
    const skip = (page - 1) * limit;

    const where: { role: UserRole; isActive?: boolean } = {
      role: UserRole.PARENT,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [parents, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: parents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const parent = await this.prisma.user.findUnique({
      where: { id, role: UserRole.PARENT },
      omit: {
        password: true,
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  }

  async update(id: number, updateParentDto: UpdateParentDto) {
    await this.findOne(id);

    const updateData: Partial<User> = {};

    if (updateParentDto.firstName) {
      updateData.firstName = updateParentDto.firstName;
    }
    if (updateParentDto.lastName) {
      updateData.lastName = updateParentDto.lastName;
    }
    if (updateParentDto.phone !== undefined) {
      updateData.phone = updateParentDto.phone;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id },
        data: updateData,
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

    return { message: 'Parent deactivated successfully' };
  }

  async linkStudent(parentId: number, studentId: number) {
    await this.findOne(parentId);

    const student = await this.prisma.user.findUnique({
      where: { id: studentId, role: UserRole.STUDENT },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const existingLink = await this.prisma.parentStudentLink.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
    });

    if (existingLink) {
      throw new BadRequestException('Student is already linked to this parent');
    }

    await this.prisma.parentStudentLink.create({
      data: {
        parentId,
        studentId,
      },
    });

    return { message: 'Student linked successfully' };
  }

  async unlinkStudent(parentId: number, studentId: number) {
    await this.findOne(parentId);

    const link = await this.prisma.parentStudentLink.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.prisma.parentStudentLink.delete({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
    });

    return { message: 'Student unlinked successfully' };
  }

  async getLinkedStudents(parentId: number) {
    await this.findOne(parentId);

    const links = await this.prisma.parentStudentLink.findMany({
      where: { parentId },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
          omit: {
            password: true,
          },
        },
      },
    });

    return links.map((link) => link.student);
  }
}
