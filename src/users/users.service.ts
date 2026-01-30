import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity'; // Verifique se o caminho da sua entity está certo
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: any) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(userData.senha, salt);

    // Criamos o objeto seguindo EXATAMENTE os nomes da Entity User
    const newUser = this.usersRepository.create({
      nome: userData.nome,
      email: userData.email,
      username: userData.email, // Use 'username' (nome correto) e preencha para não ser null
      senha: hashedPassword,
      role: userData.role || 'user',
      primeiroAcesso: true,
    });

    return this.usersRepository.save(newUser);
  }

  async updatePassword(id: number, novaSenha: string) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(novaSenha, salt);

    return this.usersRepository.update(id, {
      senha: hashedPassword,
      primeiroAcesso: false, // O "cadeado" abre aqui!
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOne(identificador: string): Promise<User | null> {
    // Isso garante que ele procure nos dois campos, só por segurança
    return this.usersRepository.findOne({
      where: [{ email: identificador }, { username: identificador }],
    });
  }
}
