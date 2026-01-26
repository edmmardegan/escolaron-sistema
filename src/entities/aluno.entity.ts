import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Matricula } from './matricula.entity';

@Entity()
export class Aluno {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ nullable: true })
  dataNascimento: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ default: true })
  ativo: boolean;

  @Column({ nullable: true })
  nomePai: string;

  @Column({ nullable: true })
  nomeMae: string;

  @Column({ nullable: true })
  rua: string;

  @Column({ nullable: true })
  bairro: string;

  @Column({ nullable: true })
  cidade: string;

  // --- DATAS DE AUDITORIA ---
  @CreateDateColumn({ type: 'timestamp', nullable: true })
  criadoEm: Date; // Preenche automático a data de cadastro

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  atualizadoEm: Date; // Atualiza sozinho sempre que você editar o aluno

  @OneToMany(() => Matricula, (matricula) => matricula.aluno)
  matriculas: Matricula[];
}
