import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleAppDto {
  @ApiProperty({ description: 'Turn the app on (start) or off (stop).' })
  @IsBoolean()
  enabled!: boolean;
}
