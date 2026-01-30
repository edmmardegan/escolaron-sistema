import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Aluno } from './aluno.entity';
import { Matricula } from './matricula.entity';

@Entity('financeiro')
export class Financeiro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  descricao: string;

  @Column('float', { nullable: true }) // <--- ADICIONE O { nullable: true } AQUI
  valorTotal: number;

  @Column()
  dataVencimento: string;

  @Column({ type: 'text', nullable: true })
  dataPagamento: string | null;

  @Column({ default: 'Aberta' })
  status: string;

  @Column({ default: 'Receita' })
  tipo: string;

  @ManyToOne(() => Aluno)
  aluno: Aluno;

  @ManyToOne(() => Matricula)
  matricula: Matricula;
}
