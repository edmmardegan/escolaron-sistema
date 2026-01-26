import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Importe suas entidades
import { Matricula } from '../entities/matricula.entity';
import { MatriculaTermo } from '../entities/matricula-termo.entity';
import { Aula } from '../entities/aula.entity'; // <--- Importante ter a Aula aqui

@Injectable()
export class MatriculaService {
  constructor(
    @InjectRepository(Matricula)
    private repo: Repository<Matricula>,

    @InjectRepository(MatriculaTermo)
    private termoRepo: Repository<MatriculaTermo>,
  ) {}

  async findAll() {
    return this.repo.find({ relations: ['aluno', 'curso', 'termos'] });
  }

  // --- AQUI ESTÁ A LÓGICA NOVA COMPLETA ---
  async create(data: any) {
    // 1. Cria a Matrícula
    const nova = this.repo.create(data as Matricula);
    const salvo = await this.repo.save(nova);

    // 2. Garante que pegamos o objeto completo com dados do Curso
    const matriculaCompleta = await this.repo.findOne({
      where: { id: Number(salvo.id) },
      relations: ['curso'],
    });

    if (
      matriculaCompleta &&
      matriculaCompleta.curso &&
      matriculaCompleta.curso.qtdeTermos
    ) {
      // Define a data da primeira aula baseada no início da matrícula
      const dataAula = new Date(matriculaCompleta.dataInicio);
      // Ajusta para meio-dia para evitar problemas de fuso horário voltando data
      dataAula.setHours(12, 0, 0, 0);

      // --- LÓGICA SEMANAL OU QUINZENAL ---
      // Se for Quinzenal pula 14 dias, se não (Semanal) pula 7.
      const diasIntervalo =
        matriculaCompleta.frequencia === 'Quinzenal' ? 14 : 7;

      // Loop para criar os Módulos (Termos)
      for (let i = 1; i <= matriculaCompleta.curso.qtdeTermos; i++) {
        const termo = this.termoRepo.create({
          numeroTermo: i,
          matricula: matriculaCompleta,
          notaTeorica: 0,
          notaPratica: 0,
        });
        const termoSalvo = await this.termoRepo.save(termo);

        // Loop para criar as 4 Aulas dentro de cada Módulo
        for (let semana = 0; semana < 4; semana++) {
          const aula = new Aula(); // Cria a instância da Aula
          aula.termo = termoSalvo;
          aula.data = new Date(dataAula); // Copia a data atual calculada
          aula.status = 'Pendente';

          // Salva a aula usando o gerenciador do repositório
          await this.termoRepo.manager.save(Aula, aula);

          // Pula os dias (7 ou 14) para a próxima aula
          dataAula.setDate(dataAula.getDate() + diasIntervalo);
        }
      }
    }

    return matriculaCompleta;
  }

  async update(id: number, data: any) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id }, relations: ['aluno', 'curso'] });
  }

  async delete(id: number) {
    return this.repo.delete(id);
  }

  async salvarNotas(termoId: number, teorica: number, pratica: number) {
    await this.termoRepo.update(termoId, {
      notaTeorica: teorica,
      notaPratica: pratica,
    });
    return { message: 'Notas salvas' };
  }
}
