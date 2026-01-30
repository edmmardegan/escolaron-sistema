import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Importação agora será usada

@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. Ativamos o Guard para que apenas quem tem Token válido acesse
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() userData: any) {
    // 2. O service agora recebe os dados validados
    return this.usersService.create(userData);
  }

  // No UsersController
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  async resetPassword(
    @Body('novaSenha') novaSenha: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId; // O JwtStrategy coloca isso aqui
    return this.usersService.updatePassword(userId, novaSenha);
  }
}
