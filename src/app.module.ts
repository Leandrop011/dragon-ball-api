import { Module } from '@nestjs/common';
import { DragonBallModule } from './dragon-ball/dragon-ball.module';
import { ConfigModule } from '@nestjs/config';
import { EnvConfiguration } from './config/app.config';
import { JoiValidationSchema } from './config/joi.validation';
import { MongooseModule } from '@nestjs/mongoose';

// ! SECTION 01 DATA BASE AND ENDPOINTS CONFIG

@Module({
  imports: [
    
    // ? agregarle configuracion y validaciones a las envs
    ConfigModule.forRoot(
      {
        isGlobal: true,
        load: [EnvConfiguration],
        // validationSchema: JoiValidationSchema,
      },
    ),

    // ? conexion to DB
    MongooseModule.forRoot(
      process.env.MONGODB!, 
      {dbName: 'nest-dragonball'}
    ),

    DragonBallModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
