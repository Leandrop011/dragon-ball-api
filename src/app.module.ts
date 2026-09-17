import { Module } from '@nestjs/common';
import { DragonBallModule } from './dragon-ball/dragon-ball.module';

@Module({
  imports: [DragonBallModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
