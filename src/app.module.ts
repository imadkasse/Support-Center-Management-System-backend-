import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { ClassesModule } from './modules/classes/classes.module';
import { StudentsModule } from './modules/students/students.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    RoomsModule,
    TeachersModule,
    ClassesModule,
    StudentsModule,
    EnrollmentsModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
