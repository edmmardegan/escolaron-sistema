import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm'; // <--- Adicione OneToMany
import { Matricula } from './matricula.entity';
import { Aula } from './aula.entity'; // <--- O IMPORT DA AULA TEM QUE ESTAR AQUI

@Entity()
export class MatriculaTermo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numeroTermo: number;

  @Column('float', { nullable: true })
  notaTeorica: number;

  @Column('float', { nullable: true })
  notaPratica: number;

  // Relação com a Matrícula (Pai)
  @ManyToOne(() => Matricula, (matricula) => matricula.termos, {
    onDelete: 'CASCADE',
  })
  matricula: Matricula;

  // --- O CÓDIGO QUE FALTA ---
  // Relação com as Aulas (Filhos)
  // Isso diz: "Eu sou o Termo, e tenho várias aulas listadas na variável 'aulas'"
  @OneToMany(() => Aula, (aula) => aula.termo)
  aulas: Aula[];
}
