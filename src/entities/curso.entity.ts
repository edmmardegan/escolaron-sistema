import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Matricula } from './matricula.entity';

@Entity('curso')
export class Curso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column('float', { nullable: true })
  valorMensalidade: number;

  // --- CAMPO DE VOLTA ---
  @Column({ default: 1 })
  qtdeTermos: number;

  @OneToMany(() => Matricula, (matricula) => matricula.curso)
  matriculas: Matricula[];
}
