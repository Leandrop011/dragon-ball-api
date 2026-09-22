import { Module } from '@nestjs/common';
import { DragonBallModule } from './dragon-ball/dragon-ball.module';
import { ConfigModule } from '@nestjs/config';
import { EnvConfiguration } from './config/app.config';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedModule } from './seed/seed.module';
import { CommonModule } from './common/common.module';

// ! SECTION 03 RESOURCE PUBLIC

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

    DragonBallModule,

    SeedModule,

    CommonModule,
  ],
})
export class AppModule {}
