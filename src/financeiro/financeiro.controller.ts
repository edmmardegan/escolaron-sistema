import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { FinanceiroService, ResumoFinanceiro } from './financeiro.service';
import * as express from 'express';

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly service: FinanceiroService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // CORREÇÃO AQUI: Mudado de 'listarPorMatricula' para 'findByMatricula'
  @Get('matricula/:id')
  findByMatricula(@Param('id') id: string) {
    return this.service.findByMatricula(+id);
  }

  @Post('gerar')
  gerarCarnet(@Body() body: { matriculaId: number; ano: number }) {
    return this.service.gerarCarnet(body.matriculaId, body.ano);
  }

  @Post(':id/pagar')
  pagar(@Param('id') id: string) {
    return this.service.pagar(+id);
  }

  @Post(':id/estornar')
  estornar(@Param('id') id: string) {
    return this.service.estornar(+id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(+id);
  }

  @Post('gerar-massivo')
  // 👇 Note o uso de 'express.Response'
  async gerarCarneMassivo(
    @Body() dadosConfig: any,
    @Res() res: express.Response,
  ) {
    try {
      const pdfBuffer = await this.service.gerarCarnePDF(dadosConfig);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=carnes-${dadosConfig.ano}.pdf`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      res.end(pdfBuffer);
    } catch (error) {
      console.error(error);
      // O compilador pode reclamar do .json se o tipo não estiver perfeito,
      // mas .send() costuma ser mais seguro com express.Response genérico
      res.status(500).send({ message: 'Erro ao gerar PDF' });
    }
  }

  @Get('resumo-professores')
  async getResumoProfessores(): Promise<ResumoFinanceiro> {
    return await this.service.obterResumoPorProfessor();
  }
}
