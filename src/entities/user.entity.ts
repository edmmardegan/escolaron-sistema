import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  // Trocamos o tipo 'enum' por 'varchar' para evitar conflito de drivers
  @Column({ default: 'user' })
  role: string; // 'adm' ou 'user'
}
