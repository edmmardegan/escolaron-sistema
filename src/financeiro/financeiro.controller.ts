import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { Financeiro } from '../entities/financeiro.entity'; // O IMPORT QUE FALTAVA

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Post('gerar-individual')
  async gerarIndividual(
    @Body() body: { matriculaId: number; ano: number },
  ): Promise<any> {
    const resultado = await this.financeiroService.gerarParcelaIndividual(
      Number(body.matriculaId),
      Number(body.ano),
    );
    return resultado;
  }

  @Post('gerar-lote-anual')
  async gerarLoteAnual(@Body() body: { ano: number }): Promise<any> {
    // Mudamos para 'any' para aceitar o objeto { gerados: number } com segurança
    const resultado = await this.financeiroService.gerarParcelaGlobal(body.ano);
    return resultado;
  }
  u;

  @Get()
  async findAll(): Promise<Financeiro[]> {
    return await this.financeiroService.findAll();
  }

  @Get('resumo-professores')
  async getResumo() {
    return await this.financeiroService.obterResumoPorProfessor();
  }

  @Get('matricula/:id')
  async findByMatricula(@Param('id') id: string): Promise<Financeiro[]> {
    return await this.financeiroService.findByMatricula(Number(id));
  }

  @Post(':id/pagar')
  async pagar(@Param('id') id: string): Promise<Financeiro> {
    return await this.financeiroService.pagar(Number(id));
  }

  @Post(':id/estornar')
  async estornar(@Param('id') id: string): Promise<Financeiro> {
    return await this.financeiroService.estornar(Number(id));
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.financeiroService.delete(Number(id));
  }
}
