import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { AlunoService } from './aluno.service';

@Controller('alunos') // Define que a rota base é http://localhost:8080/alunos
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  @Get()
  findAll() {
    return this.alunoService.findAll();
  }

  @Post()
  create(@Body() dados: any) {
    return this.alunoService.create(dados);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dados: any) {
    return this.alunoService.update(+id, dados); // O '+' converte string para numero
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alunoService.remove(+id);
  }
}
