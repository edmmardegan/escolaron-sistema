/*import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRETA', // A mesma do AuthModule
    });
  }

  async validate(payload: any) {
    // Buscamos o usuário para garantir que ele ainda existe/está ativo
    const user = await this.usersService.findByEmail(payload.username);

    if (!user) {
      throw new UnauthorizedException('Usuário não autorizado');
    }

    return { userId: payload.sub, email: payload.username, role: payload.role };
  }
}
*/
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRETA', // Use a mesma chave que está no AuthModule
    });
  }

  async validate(payload: any) {
    // Buscamos no banco para garantir que o usuário ainda existe
    const user = await this.usersService.findByEmail(payload.username);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    return { userId: payload.sub, email: payload.username, role: payload.role };
  }
}
