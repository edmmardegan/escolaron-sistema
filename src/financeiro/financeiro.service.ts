import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Financeiro } from '../entities/financeiro.entity';
import { Matricula } from '../entities/matricula.entity';
import { Repository } from 'typeorm';

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

  // --- 1. ROTINA INDIVIDUAL ---
  async gerarParcelaIndividual(matriculaId: number, ano: number): Promise<any> {
    const matricula = await this.matriculaRepo.findOne({
      where: { id: matriculaId },
      relations: ['aluno'],
    });

    if (!matricula) throw new NotFoundException('Matrícula não encontrada.');

    const novasParcelas: any[] = [];
    const dataRef = matricula.dataInicio
      ? new Date(matricula.dataInicio)
      : new Date();
    const mesInicio = dataRef.getMonth() + 1;

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
    for (let mes = mesInicio; mes <= 12; mes++) {
      const mesStr = String(mes).padStart(2, '0');

      // Pegamos o dia de vencimento original da matrícula
      let diaVencimentoEfetivo = Number(matricula.diaVencimento || 10);

      // REGRA DE FEVEREIRO: Se o dia for 30 (ou maior que 28), trava no 28
      if (mesStr === '02' && diaVencimentoEfetivo > 28) {
        diaVencimentoEfetivo = 28;
      }

      const diaStr = String(diaVencimentoEfetivo).padStart(2, '0');

      // Mantemos o T12:00:00 para evitar erro de fuso horário
      const dataVencimentoFixa = `${ano}-${mesStr}-${diaStr}T12:00:00`;

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

  // --- 2. ROTINA GLOBAL (CORRIGIDA) ---
  async gerarParcelaGlobal(ano: number): Promise<any> {
    const matriculas = await this.matriculaRepo.find({
      where: { situacao: 'Em Andamento' },
      relations: ['aluno'],
    });

    let totalGerado = 0;

    for (const mat of matriculas) {
      // Usamos any[] para evitar o erro de 'never' e Overload
      const novas: any[] = [];

      for (let mes = 1; mes <= 12; mes++) {
        const mesStr = String(mes).padStart(2, '0');
        let diaFinal = Number(mat.diaVencimento || 10);

        // 1. Regra para Fevereiro (vencimentos 30 viram 28)
        if (mesStr === '02' && diaFinal > 28) {
          diaFinal = 28;
        }

        const diaStr = String(diaFinal).padStart(2, '0');
        const dataVencimentoFixa = `${ano}-${mesStr}-${diaStr}T12:00:00`;
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

      // Salva o lote de 12 parcelas deste aluno
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

  // --- MÉTODOS DE APOIO ---
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
