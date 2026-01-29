import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos
import { AlunoModule } from './aluno/aluno.module';
import { CursoModule } from './curso/curso.module';
import { MatriculaModule } from './matricula/matricula.module';
import { FinanceiroModule } from './financeiro/financeiro.module';

import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '127.0.0.1', // <--- MUDE DE 'localhost' PARA '127.0.0.1'
      port: 5433,
      username: 'postgres', // <--- AQUI tem que ser 'postgres', não o seu e-mail!
      password: '123456', // A senha que você usa no terminal
      database: 'escolaron',
      entities: [User],
      synchronize: true,
    }),
    AlunoModule,
    CursoModule,
    MatriculaModule,
    FinanceiroModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
