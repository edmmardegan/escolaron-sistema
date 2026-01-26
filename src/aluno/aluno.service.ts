import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aluno } from '../entities/aluno.entity';

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Aluno)
    private alunoRepo: Repository<Aluno>, // Injetamos o repositório padrão do TypeORM
  ) {}

  // Listar todos
  findAll() {
    return this.alunoRepo.find({ order: { nome: 'ASC' } });
  }

  // Buscar um só (para edição)
  findOne(id: number) {
    return this.alunoRepo.findOneBy({ id });
  }

  // Criar novo
  create(dados: Partial<Aluno>) {
    const novoAluno = this.alunoRepo.create(dados);
    return this.alunoRepo.save(novoAluno);
  }

  // Atualizar
  async update(id: number, dados: Partial<Aluno>) {
    await this.alunoRepo.update(id, dados);
    return this.findOne(id);
  }

  // Deletar
  remove(id: number) {
    return this.alunoRepo.delete(id);
  }
}