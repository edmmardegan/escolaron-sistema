import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita o CORS de forma completa
  app.enableCors({
    origin: 'http://localhost:5173', // URL do seu frontend Vite
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'], // IMPORTANTE: Adicione o Authorization aqui
  });

  await app.listen(3000);
}
bootstrap();
