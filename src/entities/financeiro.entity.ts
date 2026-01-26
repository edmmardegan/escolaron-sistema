import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Aluno } from './aluno.entity';
import { Matricula } from './matricula.entity';

@Entity()
export class Financeiro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  descricao: string;

  //  @Column('float')
  //  valorTotal: number;

  @Column({
    name: 'valorTotal',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
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
