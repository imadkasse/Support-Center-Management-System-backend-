import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest {
  user: {
    id: number;
    role: UserRole;
  };
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @UseGuards(AdminGuard)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      status,
    );
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  getStats() {
    return this.paymentsService.getStats();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.findOne(id, req.user);
  }

  @Get('student/:studentId')
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.findByStudent(studentId, req.user);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Post('record')
  @UseGuards(AdminGuard)
  recordPayment(@Body() recordPaymentDto: RecordPaymentDto) {
    return this.paymentsService.recordPayment(recordPaymentDto);
  }
}
