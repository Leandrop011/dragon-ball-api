import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { DragonBallModule } from '../dragon-ball/dragon-ball.module';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [DragonBallModule, CommonModule],
})
export class SeedModule {}
