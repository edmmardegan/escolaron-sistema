import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aluno } from '../entities/aluno.entity'; // Importando a tabela que criamos
import { AlunoService } from './aluno.service';
import { AlunoController } from './aluno.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Aluno])], // Libera o uso do banco de dados para Aluno
  controllers: [AlunoController],
  providers: [AlunoService],
})
export class AlunoModule {}
