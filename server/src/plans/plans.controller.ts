import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async findAll(@Query('all') all?: string) {
    return this.plansService.findAll(all === 'true');
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.plansService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: string) {
    return this.plansService.delete(id);
  }

  @Put(':id/toggle-active')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async toggleActive(@Param('id') id: string) {
    return this.plansService.toggleActive(id);
  }
}
