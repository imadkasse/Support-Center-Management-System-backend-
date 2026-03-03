import { Module } from '@nestjs/common';
import { EnrollmentService } from './services/enrollment.service';
import { EnrollmentController } from './controllers/enrollment.controller';

@Module({
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentsModule {}
