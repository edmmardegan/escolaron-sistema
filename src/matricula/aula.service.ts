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

  async gerarAulasDoMes(mesAlvo: number, anoAlvo: number) {
    console.log(
      `--- INICIANDO GERAÇÃO: Mês ${mesAlvo + 1} / Ano ${anoAlvo} ---`,
    );

    try {
      // 1. Buscamos as matrículas ativas e seus respectivos termos
      const matriculas = await this.matriculaRepo.find({
        where: { situacao: 'Em Andamento' },
        relations: ['aluno', 'termos'],
      });

      console.log(
        `Encontradas ${matriculas.length} matrículas para processar.`,
      );

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
        // 2. Localiza o termo correto baseado no termo_atual da matrícula
        const termoAtivo = mat.termos.find(
          (t) => t.numeroTermo === mat.termo_atual,
        );

        // Validação amigável para evitar erros de 'undefined'
        if (!termoAtivo || !mat.dataInicio || !mat.diaSemana) {
          console.warn(
            `[PULANDO] Aluno: ${mat.aluno?.nome} - Verifique se tem Termo cadastrado, Data de Início e Dia da Semana.`,
          );
          continue;
        }

        const diaSemanaJs = mapaDias[mat.diaSemana.trim()];

        // Data de referência do aluno para o cálculo quinzenal (Início da Matrícula)
        const dataRef = new Date(mat.dataInicio);
        dataRef.setHours(12, 0, 0, 0);

        // 3. Loop pelos dias do mês (O JavaScript cuidará de meses com 28, 30 ou 31 dias)
        for (let d = 1; d <= 31; d++) {
          // Criamos a data da aula usando os parâmetros que vieram do seu Select (Combobox)
          const dataAula = new Date(anoAlvo, mesAlvo, d, 12, 0, 0);

          // --- A TRAVA DE SEGURANÇA ---
          // Se a data gerada 'pulou' para o mês seguinte, interrompemos o loop para este aluno
          if (dataAula.getMonth() !== mesAlvo) {
            break;
          }

          // Se o dia da semana da data atual bater com o dia da matrícula
          if (dataAula.getDay() === diaSemanaJs) {
            let deveGerar = false;

            // LÓGICA DE FREQUÊNCIA
            if (mat.frequencia === 'Semanal') {
              deveGerar = true;
            } else if (mat.frequencia === 'Quinzenal') {
              // Calcula a diferença de semanas exatas entre a aula e o início da vida acadêmica do aluno
              const diffEmMs = dataAula.getTime() - dataRef.getTime();
              const semanasDesdeOInicio = Math.floor(
                diffEmMs / (1000 * 60 * 60 * 24 * 7),
              );

              // Regra: Uma semana sim (Par), uma semana não (Ímpar)
              if (semanasDesdeOInicio % 2 === 0) {
                deveGerar = true;
              }
            }

            if (deveGerar) {
              const dataFormatada = dataAula.toISOString().split('T')[0];

              // 4. Verificação de duplicidade (Evita gerar a mesma aula duas vezes se clicar de novo)
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
      }

      console.log(`--- GERAÇÃO CONCLUÍDA: ${totalCriadas} aulas criadas ---`);
      return {
        message: `Sucesso! Foram geradas ${totalCriadas} novas aulas para o período selecionado.`,
      };
    } catch (error) {
      console.error('--- ERRO FATAL NA GERAÇÃO DA AGENDA ---', error);
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
