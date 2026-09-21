import { Module } from '@nestjs/common';
import { DragonBallService } from './dragon-ball.service';
import { DragonBallController } from './dragon-ball.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DragonBallCharacter, DragonCharacterSchema } from './entities/dragon-ball.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // * For use schema of db and make operations in db
    MongooseModule.forFeature([
      {
        name: DragonBallCharacter.name,
        schema: DragonCharacterSchema
      }
    ]),
  ],
  controllers: [DragonBallController],
  providers: [DragonBallService],
})
export class DragonBallModule {}
