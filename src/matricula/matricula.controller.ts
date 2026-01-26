import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { MatriculaService } from './matricula.service';

@Controller('matriculas')
export class MatriculaController {
  constructor(private readonly service: MatriculaService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(+id);
  }

  @Patch('termo/:id')
  updateNota(
    @Param('id') id: string,
    @Body() body: { notaTeorica: any; notaPratica: any },
  ) {
    // 1. Converte para Texto para poder trocar vírgula por ponto
    const teoricaStr = String(body.notaTeorica).replace(',', '.');
    const praticaStr = String(body.notaPratica).replace(',', '.');

    // 2. Converte para Número (parseFloat aceita decimais)
    // Se der erro (NaN), força ser 0
    const nTeorica = parseFloat(teoricaStr) || 0;
    const nPratica = parseFloat(praticaStr) || 0;

    return this.service.salvarNotas(+id, nTeorica, nPratica);
  }
}
