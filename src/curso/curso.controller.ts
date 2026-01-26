import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { CursoService } from './curso.service';

@Controller('cursos')
export class CursoController {
  constructor(private readonly service: CursoService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() body: any) { return this.service.create(body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(+id); }
}   