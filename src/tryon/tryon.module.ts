import { Module } from '@nestjs/common';
import { TryonService } from './tryon.service';
import { TryonController } from './tryon.controller';
import { Tryon, TryonSchema } from './schema/tryon.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { TryonProcessor } from './tryon.processor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tryon.name, schema: TryonSchema }]),
    BullModule.registerQueue({ name: 'tryon-queue' }),
  ],
  providers: [TryonService, TryonProcessor],
  controllers: [TryonController]
})
export class TryonModule {}
