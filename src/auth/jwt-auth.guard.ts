/*import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service'; // Precisamos do service para buscar no banco

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    // Injetando o service aqui
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRETA',
    });
  }

  // O 'async' agora é obrigatório porque usamos 'await' lá dentro
  async validate(payload: any) {
    const user = await this.usersService.findByEmail(payload.username);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // O que retornamos aqui fica disponível no 'req.user' do NestJS
    return {
      userId: payload.sub,
      email: payload.username,
      role: payload.role,
    };
  }
}*/

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
