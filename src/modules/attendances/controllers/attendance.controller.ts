import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { CreateAttendanceDto } from '../dto/create-attendance.dto';
import { BulkAttendanceDto } from '../dto/bulk-attendance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TeacherGuard } from '../../auth/guards/teacher.guard';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest {
  user: {
    id: number;
    role: UserRole;
  };
}

@Controller('attendances')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @UseGuards(TeacherGuard)
  create(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.create(createAttendanceDto, req.user.id);
  }

  @Post('bulk')
  @UseGuards(TeacherGuard)
  bulkCreate(
    @Body() bulkAttendanceDto: BulkAttendanceDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.bulkCreate(bulkAttendanceDto, req.user.id);
  }

  @Get('class/:classId')
  @UseGuards(TeacherGuard)
  findByClassAndDate(
    @Param('classId', ParseIntPipe) classId: number,
    @Query('date') date: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.findByClassAndDate(
      classId,
      date,
      req.user.id,
    );
  }

  @Get('student/:studentId')
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.findByStudent(
      studentId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findOne(id);
  }
}
