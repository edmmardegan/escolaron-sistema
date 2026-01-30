import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service'; // Ajustei o caminho para o padrão relativo

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    loginInformado: string,
    senhaDigitada: string,
  ): Promise<any> {
    const user = await this.usersService.findOne(loginInformado);

    if (!user) {
      console.log('LOG: Usuário não encontrado no banco:', loginInformado);
      return null;
    }

    const isMatch = await bcrypt.compare(senhaDigitada, user.senha);

    if (isMatch) {
      const { senha, ...result } = user;
      return result;
    }

    console.log('LOG: Senha digitada não confere para:', loginInformado);
    return null;
  }

  // ESSA É A FUNÇÃO QUE ESTAVA FALTANDO:
  async login(user: any) {
    // 1. Colocamos as informações no Payload (o que vai dentro do Token)
    const payload = {
      username: user.email,
      sub: user.id,
      role: user.role,
      primeiroAcesso: user.primeiroAcesso, // Importante para segurança extra
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      // 2. Retornamos o objeto que o React vai salvar no localStorage
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        primeiroAcesso: user.primeiroAcesso, // O Frontend vai ler isso aqui!
      },
    };
  }
}
