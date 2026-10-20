import { PartialType } from '@nestjs/swagger';
import { CreateRelapseDto } from './create-relapse.dto';

export class UpdateRelapseDto extends PartialType(CreateRelapseDto) {}
