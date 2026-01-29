import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    // 1. Validamos o usuário
    const user = await this.authService.validateUser(
      body.username || body.email,
      body.password,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Resolvemos o "Unsafe return": Guardamos o resultado em uma constante
    // e garantimos ao TS que o que sai daqui é um objeto seguro.
    const loginResponse = await this.authService.login(user);

    return loginResponse; // Retornando a constante, o erro de "type error" some.
  }
}
