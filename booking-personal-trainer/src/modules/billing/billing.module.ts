import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { BillingCharge } from './entities/billing-charge.entity';

// Services
import { BillingService } from './services/billing.service';

// Repositories
import { BillingChargeRepositoryToken } from './repositories/billing-charge.repository.interface';
import { MikroOrmBillingChargeRepository } from './repositories/mikroorm-billing-charge.repository';

@Module({
  imports: [MikroOrmModule.forFeature([BillingCharge])],
  providers: [
    BillingService,
    {
      provide: BillingChargeRepositoryToken,
      useClass: MikroOrmBillingChargeRepository,
    },
  ],
  exports: [BillingService, BillingChargeRepositoryToken],
})
export class BillingModule {}
