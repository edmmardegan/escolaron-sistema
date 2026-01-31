import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Financeiro } from '../entities/financeiro.entity';
import { Matricula } from '../entities/matricula.entity';
import { Repository, Like } from 'typeorm';

export interface ResumoFinanceiro {
  Cristiane: number;
  Daiane: number;
  Total: number;
}

@Injectable()
export class FinanceiroService {
  constructor(
    @InjectRepository(Financeiro)
    private financeiroRepo: Repository<Financeiro>,
    @InjectRepository(Matricula)
    private matriculaRepo: Repository<Matricula>,
  ) {}

  async findAll() {
    return this.financeiroRepo.find({
      relations: ['matricula', 'aluno', 'matricula.aluno'],
      order: { dataVencimento: 'ASC' },
    });
  }

  async findByMatricula(matriculaId: number): Promise<Financeiro[]> {
    return this.financeiroRepo.find({
      where: { matricula: { id: matriculaId } },
      relations: ['matricula', 'aluno', 'matricula.aluno'],
      order: { dataVencimento: 'ASC' },
    });
  }

  // --- 1. ROTINA INDIVIDUAL (COMPLETA E BLINDADA) ---
  async gerarParcelaIndividual(matriculaId: number, ano: number): Promise<any> {
    const matricula = await this.matriculaRepo.findOne({
      where: { id: matriculaId },
      relations: ['aluno'],
    });

    if (!matricula) throw new NotFoundException('Matrícula não encontrada.');

    // 🛡️ TRAVA: Verifica se já existem parcelas para este ID neste ANO
    const jaTem = await this.financeiroRepo.count({
      where: {
        matricula: { id: matriculaId },
        dataVencimento: Like(`${ano}%`),
      },
    });

    if (jaTem > 0)
      return { message: 'Este aluno já possui parcelas para este ano.' };

    const novasParcelas: any[] = [];

    // A. Taxa de Matrícula
    if (matricula.valorMatricula && Number(matricula.valorMatricula) > 0) {
      novasParcelas.push({
        aluno: matricula.aluno,
        matricula: matricula,
        descricao: `Taxa de Matrícula - ${ano}`,
        dataVencimento: new Date().toISOString().split('T')[0],
        valorTotal: Number(matricula.valorMatricula),
        status: 'Aberta',
        tipo: 'Receita',
      });
    }

    // B. Mensalidades
    const dataRef = matricula.dataInicio
      ? new Date(matricula.dataInicio)
      : new Date();
    // Se a matrícula for de um ano anterior, começa em Janeiro (1), senão no mês de início
    const mesInicio = dataRef.getFullYear() < ano ? 1 : dataRef.getMonth() + 1;

    for (let mes = mesInicio; mes <= 12; mes++) {
      const mesStr = String(mes).padStart(2, '0');
      let diaFinal = Number(matricula.diaVencimento || 10);

      // Regra de Calendário (Fevereiro e meses de 30 dias)
      if (mesStr === '02' && diaFinal > 28) diaFinal = 28;
      if (['04', '06', '09', '11'].includes(mesStr) && diaFinal > 30)
        diaFinal = 30;

      const dataVencimentoFixa = `${ano}-${mesStr}-${String(diaFinal).padStart(2, '0')}T12:00:00`;

      novasParcelas.push({
        aluno: matricula.aluno,
        matricula: matricula,
        descricao: `Mensalidade ${mesStr}/${ano}`,
        dataVencimento: dataVencimentoFixa,
        valorTotal: Number(matricula.valorMensalidade),
        status: 'Aberta',
        tipo: 'Receita',
      });
    }

    return await this.financeiroRepo.save(novasParcelas);
  }

  // --- 2. ROTINA GLOBAL (COMPLETA E BLINDADA) ---
  async gerarParcelaGlobal(ano: number): Promise<any> {
    const matriculas = await this.matriculaRepo.find({
      where: { situacao: 'Em Andamento' },
      relations: ['aluno'],
    });

    let totalGerado = 0;

    for (const mat of matriculas) {
      // 🛡️ TRAVA: Verifica se esta matrícula específica já tem dados no ano
      const parcelasExistentes = await this.financeiroRepo.count({
        where: { matricula: { id: mat.id }, dataVencimento: Like(`${ano}%`) },
      });

      // Se já houver parcelas (count > 0), pula para o próximo aluno do loop
      if (parcelasExistentes > 0) continue;

      const novas: any[] = [];

      for (let mes = 1; mes <= 12; mes++) {
        const mesStr = String(mes).padStart(2, '0');
        let diaFinal = Number(mat.diaVencimento || 10);

        // Regras de Fevereiro e meses curtos
        if (mesStr === '02' && diaFinal > 28) diaFinal = 28;
        if (['04', '06', '09', '11'].includes(mesStr) && diaFinal > 30)
          diaFinal = 30;

        const dataVencimentoFixa = `${ano}-${mesStr}-${String(diaFinal).padStart(2, '0')}T12:00:00`;

        novas.push({
          aluno: mat.aluno,
          matricula: mat,
          descricao: `Mensalidade ${mesStr}/${ano} (Lote)`,
          dataVencimento: dataVencimentoFixa,
          valorTotal: Number(mat.valorMensalidade),
          status: 'Aberta',
          tipo: 'Receita',
        });
      }

      await this.financeiroRepo.save(novas);
      totalGerado++;
    }

    return { gerados: totalGerado };
  }

  async obterResumoPorProfessor(): Promise<ResumoFinanceiro> {
    const registros = await this.financeiroRepo.find({
      relations: ['matricula'],
      where: { status: 'Paga' },
    });

    const resumo: ResumoFinanceiro = { Cristiane: 0, Daiane: 0, Total: 0 };

    registros.forEach((item) => {
      const valor = Number(item.valorTotal || 0);
      const nomeProfessor = item.matricula?.professor;

      if (nomeProfessor === 'Cristiane') resumo.Cristiane += valor;
      else if (nomeProfessor === 'Daiane') resumo.Daiane += valor;

      resumo.Total += valor;
    });

    return resumo;
  }

  async pagar(id: number) {
    const parcela = await this.financeiroRepo.findOne({ where: { id } });
    if (!parcela) throw new NotFoundException('Parcela não encontrada');
    parcela.status = 'Paga';
    return this.financeiroRepo.save(parcela);
  }

  async estornar(id: number) {
    const parcela = await this.financeiroRepo.findOne({ where: { id } });
    if (!parcela) throw new NotFoundException('Parcela não encontrada');
    parcela.status = 'Aberta';
    return this.financeiroRepo.save(parcela);
  }

  async delete(id: number) {
    return this.financeiroRepo.delete(id);
  }
}
