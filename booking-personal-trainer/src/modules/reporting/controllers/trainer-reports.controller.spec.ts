import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../../../common/enums/user/user.enum';
import { LoyalUsersReportService } from '../services/loyal-users-report.service';
import { RevenueReportService } from '../services/revenue-report.service';
import { TrainerKpiReportService } from '../services/trainer-kpi-report.service';
import { TrainerReportsController } from './trainer-reports.controller';

describe('TrainerReportsController', () => {
  let app: INestApplication;
  const revenueReportService = {
    getRevenueBuckets: jest.fn().mockResolvedValue([]),
  };
  const trainerKpiReportService = {
    getTrainerKpiRows: jest.fn().mockResolvedValue([]),
  };
  const loyalUsersReportService = {
    getLoyalUsers: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const allowGuard: CanActivate = {
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest<{ user: unknown }>();
        req.user = {
          id: 'trainer-spec-id',
          email: 't@spec.com',
          userName: 'tspec',
          role: UserRole.TRAINER,
        };
        return true;
      },
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TrainerReportsController],
      providers: [
        { provide: RevenueReportService, useValue: revenueReportService },
        { provide: TrainerKpiReportService, useValue: trainerKpiReportService },
        { provide: LoyalUsersReportService, useValue: loyalUsersReportService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET trainer/reports/revenue passes current user id filter', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    await request(httpServer).get('/trainer/reports/revenue').expect(200);
    expect(revenueReportService.getRevenueBuckets).toHaveBeenCalledWith(
      expect.objectContaining({ trainerUserIdFilter: 'trainer-spec-id' }),
    );
  });

  it('GET trainer/reports/kpi passes trainer filter', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    await request(httpServer).get('/trainer/reports/kpi').expect(200);
    expect(trainerKpiReportService.getTrainerKpiRows).toHaveBeenCalledWith(
      expect.objectContaining({ trainerUserIdFilter: 'trainer-spec-id' }),
    );
  });

  it('GET trainer/reports/loyal-users passes trainer filter', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    await request(httpServer).get('/trainer/reports/loyal-users').expect(200);
    expect(loyalUsersReportService.getLoyalUsers).toHaveBeenCalledWith(
      expect.objectContaining({ trainerUserIdFilter: 'trainer-spec-id' }),
    );
  });
});
