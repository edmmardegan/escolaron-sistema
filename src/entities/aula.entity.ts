import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MatriculaTermo } from './matricula-termo.entity';

@Entity('aula')
export class Aula {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MatriculaTermo, (termo) => termo.aulas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'termo_id' })
  termo: MatriculaTermo;

  // Mudamos para 'datetime' para guardar Data E Hora (ex: 2026-01-24 14:00)
  @Column({ type: 'timestamp', nullable: true })
  data: Date;

  // Status da aula: 'Pendente' (Agendada), 'Presente' (Veio), 'Falta' (Faltou)
  @Column({ default: 'Pendente' })
  status: string;

  // Se faltou, qual o motivo? (Ex: "Doente", "Trabalho")
  @Column({ type: 'text', nullable: true })
  motivoFalta: string | null;

  // Observações gerais da aula (opcional)
  @Column({ type: 'text', nullable: true })
  obs: string;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  criadoEm: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  atualizadoEm: Date;
}
