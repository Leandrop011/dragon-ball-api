import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ? remueve lo que no hay en los dtos
      forbidNonWhitelisted: true, // ? manda bad request si hay propiedades no requeridas o faltantes
      transform: true, // ? transformar la data a lo que pide el dto (trata si no lo logra manda error)
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  )

  // ? despues del dominio viene el global prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
