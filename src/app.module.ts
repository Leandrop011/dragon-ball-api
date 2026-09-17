import { Module } from '@nestjs/common';
import { DragonBallModule } from './dragon-ball/dragon-ball.module';

// ! SECTION 01 DATA BASE AND ENDPOINTS CONFIG

@Module({
  imports: [DragonBallModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
