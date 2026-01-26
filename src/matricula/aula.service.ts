import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Aula } from '../entities/aula.entity';
import { Matricula } from '../entities/matricula.entity';
import { MatriculaTermo } from '../entities/matricula-termo.entity';

@Injectable()
export class AulaService {
  constructor(
    @InjectRepository(Aula)
    private readonly repo: Repository<Aula>,

    @InjectRepository(Matricula)
    private readonly matriculaRepo: Repository<Matricula>,

    @InjectRepository(MatriculaTermo)
    private readonly termoRepo: Repository<MatriculaTermo>,
  ) {}

  // 1. Agenda do dia (Filtro por data no Calendário)
  async buscarPorData(dataStr: string) {
    const inicio = new Date(dataStr + 'T00:00:00');
    const fim = new Date(dataStr + 'T23:59:59');

    return this.repo.find({
      where: { data: Between(inicio, fim) },
      relations: [
        'termo',
        'termo.matricula',
        'termo.matricula.aluno',
        'termo.matricula.curso',
      ],
      order: { data: 'ASC' },
    });
  }

  // 2. Esquecidas (Aulas Pendentes de dias passados)
  async buscarNaoLancadas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return this.repo.find({
      where: {
        status: 'Pendente',
        data: LessThan(hoje),
      },
      relations: [
        'termo',
        'termo.matricula',
        'termo.matricula.aluno',
        'termo.matricula.curso',
      ],
      order: { data: 'ASC' },
    });
  }

  // 3. Reposições Pendentes (Status Falta)
  async buscarPendentes() {
    return this.repo.find({
      where: { status: 'Falta' },
      relations: [
        'termo',
        'termo.matricula',
        'termo.matricula.aluno',
        'termo.matricula.curso',
      ],
      order: { data: 'ASC' },
    });
  }

  // 4. Histórico Geral (Ordenado por Data e Nome)
  async buscarHistoricoGeral() {
    return this.repo.find({
      relations: [
        'termo',
        'termo.matricula',
        'termo.matricula.aluno',
        'termo.matricula.curso',
      ],
      order: {
        data: 'ASC',
        termo: {
          matricula: {
            aluno: { nome: 'ASC' },
          },
        },
      },
    });
  }

  // 5. Geração Manual de Aulas (Baseado no termo_atual da matrícula)
  async gerarAulasDoMes() {
    const matriculas = await this.matriculaRepo.find();
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    const novasAulas: Aula[] = [];

    const inicioMes = new Date(ano, mes, 1, 0, 0, 0);
    const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59);

    const mapaDias: Record<string, number> = {
      Domingo: 0,
      Segunda: 1,
      Terca: 2,
      Terça: 2,
      Quarta: 3,
      Quinta: 4,
      Sexta: 5,
      Sabado: 6,
      Sábado: 6,
    };

    for (const mat of matriculas) {
      try {
        if (mat.situacao !== 'Em Andamento' || !mat.diaSemana) continue;

        const jaTemAula = await this.repo
          .createQueryBuilder('aula')
          .innerJoin('aula.termo', 'termo')
          .where('termo.matriculaId = :mId', { mId: mat.id })
          .andWhere('aula.data BETWEEN :inicio AND :fim', {
            inicio: inicioMes,
            fim: fimMes,
          })
          .getOne();

        if (jaTemAula) continue;

        const termoDestino = await this.termoRepo.findOne({
          where: {
            matricula: { id: mat.id },
            numeroTermo: mat.termo_atual || 1,
          },
        });

        if (!termoDestino) continue;

        const diaDesejado = mapaDias[mat.diaSemana] ?? 1;
        const horarioStr = mat.horario || '08:00';
        const [hora, minuto] = horarioStr.split(':').map(Number);

        // Usamos let aqui porque vamos reatribuir o valor no loop de semanas
        let dataReferencia = new Date(ano, mes, 1, hora, minuto, 0);

        while (dataReferencia.getDay() !== diaDesejado) {
          dataReferencia.setDate(dataReferencia.getDate() + 1);
        }

        while (dataReferencia.getMonth() === mes) {
          const aula = this.repo.create({
            data: new Date(dataReferencia),
            status: 'Pendente',
            termo: termoDestino,
          });
          novasAulas.push(aula);

          const salto = mat.frequencia === 'Quinzenal' ? 14 : 7;
          // Reatribuímos para uma nova instância para evitar o erro de const/let do linter
          const proximaData = new Date(dataReferencia);
          proximaData.setDate(proximaData.getDate() + salto);
          dataReferencia = proximaData;
        }
      } catch (err: unknown) {
        // Correção do "Unsafe assignment":
        const mensagemErro =
          err instanceof Error ? err.message : 'Erro desconhecido';
        console.error(`Falha no aluno ${mat.id}:`, mensagemErro);
      }
    }

    if (novasAulas.length === 0) return { message: 'Nenhuma nova aula.' };
    return await this.repo.save(novasAulas);
  }

  // --- AÇÕES DE FREQUÊNCIA ---

  async registrarPresenca(id: number) {
    return this.repo.update(id, { status: 'Presente', motivoFalta: null });
  }

  async registrarFalta(id: number, motivo: string) {
    return this.repo.update(id, { status: 'Falta', motivoFalta: motivo });
  }

  async registrarReposicao(id: number, novaData: string) {
    return this.repo.update(id, {
      data: new Date(novaData),
      status: 'Presente',
      motivoFalta: null,
    });
  }
}
