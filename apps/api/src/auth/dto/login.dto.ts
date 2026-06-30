import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'demo@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'demo123' })
  @IsNotEmpty()
  password: string;
}
