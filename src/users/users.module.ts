import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { UsersController } from './users.controller'; // <-- IMPORTAÇÃO

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController], // <-- ESSA LINHA É A QUE GERA O LOG NO TERMINAL!
  exports: [UsersService],
})
export class UsersModule {}
