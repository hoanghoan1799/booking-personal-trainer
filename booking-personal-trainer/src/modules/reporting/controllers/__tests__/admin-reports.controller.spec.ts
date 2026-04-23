import { INestApplication, CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { LoyalUsersReportService } from '../../services/loyal-users-report.service';
import { RevenueReportService } from '../../services/revenue-report.service';
import { TrainerKpiReportService } from '../../services/trainer-kpi-report.service';
import { AdminReportsController } from '../admin-reports.controller';

const allowGuard: CanActivate = {
  canActivate(): boolean {
    return true;
  },
};

describe('AdminReportsController', () => {
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
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AdminReportsController],
      providers: [
        { provide: RevenueReportService, useValue: revenueReportService },
        { provide: TrainerKpiReportService, useValue: trainerKpiReportService },
        { provide: LoyalUsersReportService, useValue: loyalUsersReportService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET admin/reports/revenue returns wrapped data', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const res = await request(httpServer)
      .get('/admin/reports/revenue')
      .expect(200);
    expect(revenueReportService.getRevenueBuckets).toHaveBeenCalled();
    expect((res.body as { data: unknown[] }).data).toEqual([]);
  });

  it('GET admin/reports/trainer-kpi returns wrapped data', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    await request(httpServer).get('/admin/reports/trainer-kpi').expect(200);
    expect(trainerKpiReportService.getTrainerKpiRows).toHaveBeenCalled();
  });

  it('GET admin/reports/loyal-users returns wrapped data', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    await request(httpServer).get('/admin/reports/loyal-users').expect(200);
    expect(loyalUsersReportService.getLoyalUsers).toHaveBeenCalled();
  });
});
