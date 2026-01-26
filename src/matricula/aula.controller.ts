import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Body,
  Post,
} from '@nestjs/common';
import { AulaService } from './aula.service';

@Controller('aulas')
export class AulaController {
  constructor(private readonly aulaService: AulaService) {}

  @Get('agenda')
  async buscarAgenda(@Query('data') data: string): Promise<any> {
    return this.aulaService.buscarPorData(data);
  }

  @Get('pendentes')
  async buscarPendentes(): Promise<any> {
    return this.aulaService.buscarPendentes();
  }

  @Patch(':id/presenca')
  async registrarPresenca(@Param('id') id: number): Promise<any> {
    return this.aulaService.registrarPresenca(id);
  }

  @Patch(':id/falta')
  async registrarFalta(
    @Param('id') id: number,
    @Body('motivo') motivo: string,
  ): Promise<any> {
    return this.aulaService.registrarFalta(id, motivo);
  }

  @Patch(':id/reposicao')
  async registrarReposicao(
    @Param('id') id: number,
    @Body('novaData') novaData: string,
  ): Promise<any> {
    return this.aulaService.registrarReposicao(id, novaData);
  }

  @Get('nao-lancadas')
  async buscarNaoLancadas() {
    return await this.aulaService.buscarNaoLancadas();
  }

  @Get('historico')
  async buscarHistorico() {
    return await this.aulaService.buscarHistoricoGeral();
  }

  @Post('gerar-mensal')
  async gerarAulasMensais() {
    return await this.aulaService.gerarAulasDoMes();
  }
}
