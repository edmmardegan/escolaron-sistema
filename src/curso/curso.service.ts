import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from '../entities/curso.entity';

@Injectable()
export class CursoService {
  constructor(
    @InjectRepository(Curso)
    private repo: Repository<Curso>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  create(dados: Partial<Curso>) {
    return this.repo.save(this.repo.create(dados));
  }

  // Já deixei pronto para você usar depois se precisar
  findOne(id: number) { return this.repo.findOneBy({ id }); }
  remove(id: number) { return this.repo.delete(id); }
}