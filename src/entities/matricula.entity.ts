import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Aluno } from './aluno.entity';
import { Curso } from './curso.entity';
import { Financeiro } from './financeiro.entity';
import { MatriculaTermo } from './matricula-termo.entity';

@Entity('matricula')
export class Matricula {
  @PrimaryGeneratedColumn()
  id: number;

  // --- RELACIONAMENTOS ---
  @ManyToOne(() => Aluno, (aluno) => aluno.matriculas)
  @JoinColumn({ name: 'aluno_id' })
  aluno: Aluno;

  @ManyToOne(() => Curso, (curso) => curso.matriculas)
  @JoinColumn({ name: 'curso_id' })
  curso: Curso;

  // --- FINANCEIRO DA MATRÍCULA ---
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorMatricula: number; // <--- SEU NOVO CAMPO AQUI

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorMensalidade: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorCombustivel: number; // Só preenche se for residencial

  @Column()
  diaVencimento: number; // 5, 10, 15...

  // --- DADOS DO CONTRATO ---
  @Column({ default: 'Em Andamento' })
  situacao: string; // Em Andamento, Trancado, Finalizado

  @Column({ default: 'Presencial' })
  tipo: string; // Presencial ou Residencial

  @Column({ name: 'termo_atual', type: 'int', default: 1 })
  termo_atual: number;

  @CreateDateColumn()
  dataInicio: Date;

  @Column({ type: 'date', nullable: true })
  dataTermino: string;

  @OneToMany(() => MatriculaTermo, (termo) => termo.matricula)
  termos: MatriculaTermo[];

  // Uma matrícula gera vários boletos financeiros
  @OneToMany(() => Financeiro, (fin) => fin.matricula)
  financeiros: Financeiro[];

  // --- DATAS DE AUDITORIA ---
  @CreateDateColumn()
  criadoEm: Date; // Preenche automático a data de cadastro

  @UpdateDateColumn()
  atualizadoEm: Date; // Atualiza sozinho sempre que você editar o aluno

  @Column({ nullable: true })
  diaSemana: string; // Ex: "Segunda", "Terca", "Quarta"...

  @Column({ nullable: true })
  horario: string; // Ex: "14:00", "09:30"

  @Column({ default: 'Semanal' })
  frequencia: string; // Vai receber 'Semanal' ou 'Quinzenal'

  @Column({ nullable: true })
  professor: string;
}
