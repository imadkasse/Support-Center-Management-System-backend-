import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ParentsService } from './parents.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { ParentGuard } from '../auth/guards/parent.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: number;
    role: UserRole;
  };
}

@Controller('parents')
@UseGuards(JwtAuthGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createParentDto: CreateParentDto) {
    return this.parentsService.create(createParentDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.parentsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new Error('Unauthorized');
    }
    return this.parentsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateParentDto: UpdateParentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new Error('Unauthorized');
    }
    return this.parentsService.update(id, updateParentDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.parentsService.remove(id);
  }

  @Post('link-student')
  linkStudent(
    @Body() body: { studentId: number },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.parentsService.linkStudent(req.user.id, body.studentId);
  }

  @Delete(':parentId/unlink-student/:studentId')
  unlinkStudent(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== parentId) {
      throw new Error('Unauthorized');
    }
    return this.parentsService.unlinkStudent(parentId, studentId);
  }

  @Get(':id/students')
  @UseGuards(ParentGuard)
  getLinkedStudents(@Request() req: AuthenticatedRequest) {
    const id = req.user.id;
    return this.parentsService.getLinkedStudents(id);
  }
}
