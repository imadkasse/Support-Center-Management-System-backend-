import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { StudentGuard } from '../../auth/guards/student.guard';
import { ParentGuard } from '../../auth/guards/parent.guard';
import { UserRole } from '@prisma/client';

interface AuthenticatedRequest {
  user: {
    id: number;
    role: UserRole;
  };
}

@Controller('dashboards')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAdminStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('admin/total-active-students')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getTotalActiveStudents() {
    return this.dashboardService.getTotalActiveStudents();
  }

  @Get('admin/total-enrolled-students')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getTotalEnrolledStudents() {
    return this.dashboardService.getTotalEnrolledStudents();
  }

  @Get('admin/active-classes')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getActiveClasses() {
    return this.dashboardService.getActiveClasses();
  }

  @Get('admin/full-capacity-classes')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getFullCapacityClasses() {
    return this.dashboardService.getFullCapacityClassesCorrect();
  }

  @Get('admin/expired-subscriptions')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getExpiredSubscriptions() {
    return this.dashboardService.getExpiredSubscriptions();
  }

  @Get('admin/monthly-revenue')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getMonthlyRevenue() {
    return this.dashboardService.getMonthlyRevenue();
  }

  @Get('student/enrolled-classes')
  @UseGuards(JwtAuthGuard, StudentGuard)
  getStudentEnrolledClasses(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getStudentEnrolledClasses(req.user.id);
  }

  @Get('student/weekly-schedule')
  @UseGuards(JwtAuthGuard, StudentGuard)
  getStudentWeeklySchedule(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getStudentWeeklySchedule(req.user.id);
  }

  @Get('student/subscription-status')
  @UseGuards(JwtAuthGuard, StudentGuard)
  getStudentSubscriptionStatus(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getStudentSubscriptionStatus(req.user.id);
  }

  @Get('student/days-remaining')
  @UseGuards(JwtAuthGuard, StudentGuard)
  getStudentDaysRemaining(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getStudentDaysRemaining(req.user.id);
  }

  @Get('parent/students-attendance')
  @UseGuards(JwtAuthGuard, ParentGuard)
  getLinkedStudentsAttendance(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getLinkedStudentsAttendance(req.user.id);
  }

  @Get('parent/students-subscription')
  @UseGuards(JwtAuthGuard, ParentGuard)
  getLinkedStudentsSubscriptionStatus(@Request() req: AuthenticatedRequest) {
    return this.dashboardService.getLinkedStudentsSubscriptionStatus(
      req.user.id,
    );
  }
}
