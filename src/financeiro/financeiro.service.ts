import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Financeiro } from '../entities/financeiro.entity';
import { Matricula } from '../entities/matricula.entity';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

export interface ResumoFinanceiro {
  Cristiane: number;
  Daiane: number;
  Total: number;
}

interface RegistroDoBanco {
  valor?: number;
  valorTotal?: number;
  status?: string;
  matricula?: {
    professor?: string;
  };
}

@Injectable()
export class FinanceiroService {
  constructor(
    @InjectRepository(Financeiro)
    private financeiroRepo: Repository<Financeiro>,
    @InjectRepository(Matricula)
    private matriculaRepo: Repository<Matricula>,
  ) {}

  // --- CRUD BÁSICO ---
  async findAll() {
    return this.financeiroRepo.find({
      relations: ['matricula', 'matricula.aluno'],
      order: { dataVencimento: 'ASC' },
    });
  }

  async findByMatricula(matriculaId: number) {
    return this.financeiroRepo.find({
      where: { matricula: { id: matriculaId } },
      relations: ['matricula', 'matricula.aluno'],
      order: { dataVencimento: 'ASC' },
    });
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

  async gerarCarnet(matriculaId: number, ano: number) {
    const matricula = await this.matriculaRepo.findOne({
      where: { id: matriculaId },
      relations: ['aluno'],
    });

    if (!matricula) throw new NotFoundException('Matrícula não encontrada');
    const parcelas: Financeiro[] = [];
    const diaVencimento = matricula.diaVencimento || 10;
    const valor = matricula.valorMensalidade || 0;

    for (let mes = 0; mes < 12; mes++) {
      const dataVenc = new Date(ano, mes, diaVencimento);
      const dataString = dataVenc.toISOString().split('T')[0];

      const novaParcela = this.financeiroRepo.create({
        matricula: matricula,
        descricao: `Mensalidade ${mes + 1}/${ano}`,
        dataVencimento: dataString as any,
        valorTotal: valor,
        status: 'Aberta',
      } as unknown as Financeiro);

      parcelas.push(novaParcela);
    }
    return this.financeiroRepo.save(parcelas);
  }

  async obterResumoPorProfessor(): Promise<ResumoFinanceiro> {
    const dadosBrutos = await this.financeiroRepo.find({
      relations: ['matricula'],
      where: { status: 'Paga' },
    });
    const registros = dadosBrutos as unknown as RegistroDoBanco[];
    const resumo: ResumoFinanceiro = { Cristiane: 0, Daiane: 0, Total: 0 };
    registros.forEach((item) => {
      const valor = Number(item.valorTotal ?? item.valor ?? 0);
      const nomeProfessor = item.matricula?.professor;
      if (nomeProfessor === 'Cristiane') resumo.Cristiane += valor;
      else if (nomeProfessor === 'Daiane') resumo.Daiane += valor;
      resumo.Total += valor;
    });
    return resumo;
  }

  // --- GERADOR DE PDF ---
  async gerarCarnePDF(dadosConfig: any): Promise<Buffer> {
    const { ano, meses, incluirCapa, incluirMatricula } = dadosConfig;
    console.log('=== BACKEND: INICIANDO GERAÇÃO DE PDF ===');
    console.log('Dados recebidos no Service:', { ano, meses, incluirCapa });
    // AQUI ESTAVA O PROBLEMA: Fontes
    // Vamos usar fontes padrão do sistema (StandardFonts) que não exigem arquivos .ttf
    const fonts = {
      Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique',
      },
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };

    const printer = new (PdfPrinter as any)(fonts);

    const matriculas = await this.matriculaRepo.find({ relations: ['aluno'] });
    console.log(`Gerando carnês para ${matriculas.length} alunos...`); // LOG NO SERVER

    const docContent: any[] = [];

    for (const mat of matriculas) {
      const nomeAluno = mat.aluno?.nome || 'Aluno Sem Nome';
      const diaVencimento = mat.diaVencimento || 10;
      const valorMensalidade = Number(mat.valorMensalidade || 0);
      const stackAluno: any[] = [];

      if (incluirCapa) {
        stackAluno.push({
          stack: [
            {
              text: 'CARNÊ DE PAGAMENTO',
              style: 'capaTitulo',
              alignment: 'center',
            },
            { text: '\n' },
            {
              text: `Aluno: ${nomeAluno.toUpperCase()}\nVencimento: dia ${diaVencimento}`,
              style: 'capaTexto',
              alignment: 'center',
            },
            { text: '\n' },
            {
              text: 'Após 5 dias do vencimento será cobrado multa de R$ 5.00',
              style: 'capaMulta',
              alignment: 'center',
            },
          ],
          absolutePosition: { x: 40, y: null },
          margin: [0, 0, 0, 28],
        });
      }

      if (incluirMatricula) {
        stackAluno.push(
          this.criarLayoutParcela('Matrícula', 'Única', nomeAluno, null, null),
        );
      }

      if (meses && meses.length > 0) {
        meses.forEach((mesNum) => {
          const nomeMes = this.getNomeMes(mesNum);
          const dataVenc = `${diaVencimento}/${mesNum.toString().padStart(2, '0')}/${ano}`;
          stackAluno.push(
            this.criarLayoutParcela(
              'Mensalidade',
              `${nomeMes}/${ano}`,
              nomeAluno,
              dataVenc,
              valorMensalidade,
            ),
          );
        });
      }

      docContent.push(...stackAluno);
      docContent.push({ text: '', pageBreak: 'after' });
    }

    const docDefinition = {
      content: docContent,
      defaultStyle: { font: 'Helvetica' }, // Fonte Segura
      pageSize: 'A4',
      pageMargins: [20, 20, 20, 20] as [number, number, number, number],
      styles: {
        capaTitulo: { fontSize: 18, bold: true },
        capaTexto: { fontSize: 12, bold: true },
        capaMulta: { fontSize: 10, color: 'red' },
        reciboTitulo: { fontSize: 10, bold: true },
        reciboTexto: { fontSize: 9 },
        reciboValor: { fontSize: 12, bold: true },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition as any);

    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => {
        console.error('ERRO DENTRO DO PDFMAKE:', err); // LOG DE ERRO
        reject(err instanceof Error ? err : new Error(String(err)));
      });
      pdfDoc.end();
    });
  }

  private criarLayoutParcela(
    tipo: string,
    referencia: string,
    aluno: string,
    vencimento: string | null,
    valor: number | null,
  ) {
    const conteudoRecibo = [
      { text: `Recibo de ${tipo}`, style: 'reciboTitulo', alignment: 'center' },
      { text: '\n' },
      {
        text: aluno.substring(0, 25),
        style: 'reciboTexto',
        alignment: 'center',
      },
      { text: '\n' },
      {
        text: tipo === 'Matrícula' ? 'MATRÍCULA' : `Mensalidade ${referencia}`,
        fontSize: 10,
        bold: true,
        alignment: 'center',
      },
      { text: '\n' },
      {
        columns: [
          {
            text: vencimento ? `Venc: ${vencimento}` : '',
            style: 'reciboTexto',
            fontSize: 9,
          },
          {
            text: 'Pagto: __/__/__',
            style: 'reciboTexto',
            alignment: 'right',
            fontSize: 9,
          },
        ],
      },
      {
        text: valor ? `Valor R$: ${valor.toFixed(2)}` : 'Valor R$: ______',
        style: 'reciboValor',
        margin: [0, 5, 0, 0],
      },
    ];

    return {
      columns: [
        { stack: conteudoRecibo, width: 170 },
        { text: '', width: 50 },
        { stack: conteudoRecibo, width: 170 },
      ],
      margin: [0, 0, 0, 30],
    };
  }

  private getNomeMes(num: number): string {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return meses[num - 1] || '';
  }
}
