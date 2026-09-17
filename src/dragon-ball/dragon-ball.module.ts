import { Module } from '@nestjs/common';
import { DragonBallService } from './dragon-ball.service';
import { DragonBallController } from './dragon-ball.controller';

@Module({
  controllers: [DragonBallController],
  providers: [DragonBallService],
})
export class DragonBallModule {}
