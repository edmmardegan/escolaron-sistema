import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'usuarios' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  email: string;

  @Column()
  username: string; // Se o seu banco usa username, mantenha aqui

  @Column()
  senha: string; // Nome que decidimos usar no código e no banco

  @Column({ default: 'user' })
  role: string;

  @Column({ default: true })
  primeiroAcesso: boolean;
}
