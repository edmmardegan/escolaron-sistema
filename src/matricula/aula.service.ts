import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, Raw } from 'typeorm';
import { Aula } from '../entities/aula.entity';
import { Matricula } from '../entities/matricula.entity';
import { MatriculaTermo } from '../entities/matricula-termo.entity';
import { Like } from 'typeorm';

@Injectable()
export class AulaService {
  constructor(
    @InjectRepository(Aula)
    private readonly aulaRepo: Repository<Aula>,

    @InjectRepository(Matricula)
    private readonly matriculaRepo: Repository<Matricula>,

    @InjectRepository(MatriculaTermo)
    private readonly termoRepo: Repository<MatriculaTermo>,
  ) {}

  // 1. Agenda do dia (Filtro por data no Calendário)
  async buscarPorData(dataStr: string) {
    const aulas = await this.aulaRepo
      .createQueryBuilder('aula')
      .leftJoinAndSelect('aula.termo', 'termo')
      .leftJoinAndSelect('termo.matricula', 'matricula')
      .leftJoinAndSelect('matricula.aluno', 'aluno')
      .leftJoinAndSelect('matricula.curso', 'curso')
      .where('CAST(aula.data AS DATE) = :data', { data: dataStr })
      .orderBy('aula.data', 'ASC')
      .getMany();

    console.log('Aulas encontradas no Banco:', aulas.length);
    return aulas;
  }

  // 2. Esquecidas (Aulas Pendentes de dias passados)
  async buscarNaoLancadas() {
    const hoje = new Date().toISOString().split('T')[0]; // Pega '2026-01-31'

    return this.aulaRepo.find({
      where: {
        status: 'Pendente',
        data: LessThan(new Date(hoje + 'T00:00:00Z')), // Garante comparação correta
      },
      relations: [
        'termo',
        'termo.matricula',
        'termo.matricula.aluno',
        'termo.matricula.curso',
      ],
      order: { data: 'DESC' }, // As mais recentes primeiro
    });
  }

  // 3. Reposições Pendentes (Status Falta)
  async buscarPendentes() {
    return this.aulaRepo.find({
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
    return this.aulaRepo.find({
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

  async gerarAulasDoMes() {
    console.log('--- INICIANDO GERAÇÃO DE AGENDA (VERSÃO CORRIGIDA) ---');
    try {
      const agora = new Date();
      const mesAtual = agora.getMonth();
      const anoAtual = agora.getFullYear();

      const matriculas = await this.matriculaRepo.find({
        where: { situacao: 'Em Andamento' },
        relations: ['aluno', 'termos'],
      });

      let totalCriadas = 0;
      const mapaDias = {
        Domingo: 0,
        Segunda: 1,
        Terca: 2,
        Quarta: 3,
        Quinta: 4,
        Sexta: 5,
        Sabado: 6,
      };

      for (const mat of matriculas) {
        // 1. BUSCA O TERMO CORRETO (A lógica que faltava)
        // Em vez de mat.termos[0], procuramos o termo que bate com mat.termo_atual
        const termoAtivo = mat.termos.find(
          (t) => t.numeroTermo === mat.termo_atual,
        );

        if (!termoAtivo) {
          console.warn(
            `[AVISO] Aluno ${mat.aluno?.nome} está no termo ${mat.termo_atual}, mas esse termo não existe na tabela matricula_termo.`,
          );
          continue;
        }

        const diaSemanaJs = mapaDias[mat.diaSemana?.trim()];
        if (diaSemanaJs === undefined) continue;

        console.log(
          `> Gerando para ${mat.aluno?.nome} (Termo: ${termoAtivo.numeroTermo})`,
        );

        for (let d = 1; d <= 31; d++) {
          const dataAula = new Date(anoAtual, mesAtual, d, 12, 0, 0);
          if (dataAula.getMonth() !== mesAtual) break;

          if (dataAula.getDay() === diaSemanaJs) {
            const dataFormatada = dataAula.toISOString().split('T')[0];

            // 2. VERIFICAÇÃO DE DUPLICIDADE
            const existe = await this.aulaRepo.findOne({
              where: {
                termo: { id: termoAtivo.id },
                data: Raw(
                  (alias) => `CAST(${alias} AS DATE) = '${dataFormatada}'`,
                ),
              },
            });

            if (!existe) {
              await this.aulaRepo.save({
                termo: termoAtivo,
                data: dataAula,
                status: 'Pendente',
              });
              totalCriadas++;
            }
          }
        }
      }

      return { message: `Sucesso! Foram geradas ${totalCriadas} novas aulas.` };
    } catch (error) {
      console.error('--- ERRO NA GERAÇÃO ---', error);
      throw error;
    }
  }

  // --- AÇÕES DE FREQUÊNCIA ---

  async registrarPresenca(id: number) {
    return this.aulaRepo.update(id, { status: 'Presente', motivoFalta: null });
  }

  async registrarFalta(id: number, motivo: string) {
    return this.aulaRepo.update(id, { status: 'Falta', motivoFalta: motivo });
  }

  async registrarReposicao(id: number, novaData: string) {
    const aula = await this.aulaRepo.findOne({ where: { id } });

    if (!aula) throw new NotFoundException('Aula não encontrada');

    const dataHoje = new Date().toLocaleDateString('pt-BR');

    // 1. O status vira Presença (pois a reposição foi concluída)
    aula.status = 'Presença';

    // 2. Gravamos a nota da reposição no campo OBS
    // Mantemos qualquer observação que já existia e adicionamos a nova
    const obsAnterior = aula.obs ? `${aula.obs} | ` : '';
    aula.obs = `${obsAnterior}Aula de reposição realizada em ${dataHoje}`;

    // 3. Opcional: Se quiser que a data da aula no banco mude para a data da reposição
    // aula.data = new Date(novaData);

    return await this.aulaRepo.save(aula);
  }
}
