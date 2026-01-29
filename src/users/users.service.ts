import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity'; // Verifique se o caminho da sua entity está certo

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(identificador: string): Promise<User | null> {
    // Isso garante que ele procure nos dois campos, só por segurança
    return this.usersRepository.findOne({
      where: [{ email: identificador }, { username: identificador }],
    });
  }
}
