import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Matricula } from '../entities/matricula.entity';
import { MatriculaTermo } from '../entities/matricula-termo.entity';
import { Aula } from '../entities/aula.entity'; // Certifique-se de importar a entidade
import { MatriculaService } from './matricula.service';
import { MatriculaController } from './matricula.controller';
import { AulaService } from './aula.service'; // Importar o Service
import { AulaController } from './aula.controller'; // Importar o Controller que criamos agora

@Module({
  imports: [
    TypeOrmModule.forFeature([Matricula, MatriculaTermo, Aula]), // Certifique-se que Matricula está aqui
  ],
  controllers: [MatriculaController, AulaController],
  providers: [MatriculaService, AulaService],
})
export class MatriculaModule {}
