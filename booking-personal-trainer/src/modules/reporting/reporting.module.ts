import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { Booking } from '../booking/entities/booking.entity';
import { Payment } from '../payments/entities/payment.entity';
import { User } from '../user/entities/user.entity';
import { Workout } from '../workout/entities/workout.entity';

import { AdminReportsController } from './controllers/admin-reports.controller';
import { TrainerReportsController } from './controllers/trainer-reports.controller';
import { LoyalUsersReportService } from './services/loyal-users-report.service';
import { RevenueReportService } from './services/revenue-report.service';
import { TrainerKpiReportService } from './services/trainer-kpi-report.service';

@Module({
  imports: [MikroOrmModule.forFeature([Payment, Booking, Workout, User])],
  controllers: [AdminReportsController, TrainerReportsController],
  providers: [
    RevenueReportService,
    TrainerKpiReportService,
    LoyalUsersReportService,
  ],
})
export class ReportingModule {}
