import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos
import { AlunoModule } from './aluno/aluno.module';
import { CursoModule } from './curso/curso.module';
import { MatriculaModule } from './matricula/matricula.module';
import { FinanceiroModule } from './financeiro/financeiro.module';

// Entidades
import { Aluno } from './entities/aluno.entity';
import { Curso } from './entities/curso.entity';
import { Matricula } from './entities/matricula.entity';
import { MatriculaTermo } from './entities/matricula-termo.entity';
import { Financeiro } from './entities/financeiro.entity';
import { Aula } from './entities/aula.entity';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres', // <--- Verifique se não está 'sqlite' aqui por engano
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'mysecretpassword',
      database: 'escolaron',
      entities: [
        User,
        Aluno,
        Aula,
        Curso,
        Matricula,
        MatriculaTermo,
        Financeiro,
      ],
      synchronize: true, // Isso cria as tabelas automaticamente
    }),
    AlunoModule,
    CursoModule,
    MatriculaModule,
    FinanceiroModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
