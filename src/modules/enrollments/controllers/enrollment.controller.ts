import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { EnrollmentService } from '../services/enrollment.service';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EnrollmentStatus } from '@prisma/client';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, AdminGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentService.create(createEnrollmentDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('studentId', new DefaultValuePipe(0), ParseIntPipe)
    studentId: number,
    @Query('classId', new DefaultValuePipe(0), ParseIntPipe) classId: number,
    @Query('status') status?: EnrollmentStatus,
  ) {
    const filters: {
      page: number;
      limit: number;
      studentId?: number;
      classId?: number;
      status?: EnrollmentStatus;
    } = {
      page,
      limit,
    };

    if (studentId > 0) {
      filters.studentId = studentId;
    }

    if (classId > 0) {
      filters.classId = classId;
    }

    if (status) {
      filters.status = status;
    }

    return this.enrollmentService.findAll(
      filters.page,
      filters.limit,
      filters.studentId,
      filters.classId,
      filters.status,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentService.update(id, updateEnrollmentDto);
  }

  @Post(':id/confirm-payment')
  confirmPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ) {
    return this.enrollmentService.confirmPayment(
      id,
      confirmPaymentDto.subscriptionDays,
    );
  }

  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentService.cancel(id);
  }
}
