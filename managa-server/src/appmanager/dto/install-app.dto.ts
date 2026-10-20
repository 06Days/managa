import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InstallAppDto {
  @ApiProperty({
    description:
      'GitHub repository URL, owner/repo shorthand, or SSH URL. The repository must contain managa.app.json at its root.',
    example: 'https://github.com/owner/my-managa-app',
  })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @ApiPropertyOptional({
    description: 'Optional branch, tag or commit-ish to clone.',
    example: 'main',
  })
  @IsOptional()
  @IsString()
  ref?: string;

  @ApiPropertyOptional({
    description: 'Start the app immediately after a successful install.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  start?: boolean;
}
