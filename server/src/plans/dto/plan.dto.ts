import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';

enum PlanFrequency {
  daily = 'daily',
  weekly = 'weekly',
  monthly = 'monthly',
}

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsEnum(PlanFrequency)
  frequency!: PlanFrequency;

  @IsNumber()
  @Min(0.01)
  price!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PlanFrequency)
  frequency?: PlanFrequency;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
