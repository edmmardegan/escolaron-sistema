import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // No NestJS: src/auth/auth.service.ts
  async login(username: string, pass: string) {
    // Verifique se o nome do campo no banco é 'username'
    const user = await this.userRepo.findOne({ where: { username: username } });

    if (user && user.password === pass) {
      return {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    }
    // Se ele chegar aqui, ele lança o 401 que você viu no console
    throw new UnauthorizedException('Usuário ou senha inválidos');
  }
}
