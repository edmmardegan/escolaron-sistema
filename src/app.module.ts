import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// --- IMPORTAÇÃO DAS ENTIDADES ---
// Verifique se todos esses arquivos estão dentro da pasta src/entities/
import { Aluno } from './entities/aluno.entity';
import { User } from './entities/user.entity';
import { Aula } from './entities/aula.entity';
import { Curso } from './entities/curso.entity';
import { Matricula } from './entities/matricula.entity';
import { Financeiro } from './entities/financeiro.entity';

// --- IMPORTAÇÃO DOS MÓDULOS ---
import { AlunoModule } from './aluno/aluno.module';
import { CursoModule } from './curso/curso.module';
import { MatriculaModule } from './matricula/matricula.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MatriculaTermo } from './entities/matricula-termo.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '127.0.0.1',
      port: 5433,
      username: 'postgres',
      password: '123456',
      database: 'escolaron',
      // Listamos todas as entidades aqui para o TypeORM criar as tabelas
      entities: [
        User,
        Aluno,
        Aula,
        Curso,
        Financeiro,
        Matricula,
        MatriculaTermo,
      ],
      synchronize: true, // Mantém o banco sincronizado com as Entities
    }),
    // Módulos do Sistema
    UsersModule,
    AuthModule,
    AlunoModule,
    CursoModule,
    MatriculaModule,
    FinanceiroModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
