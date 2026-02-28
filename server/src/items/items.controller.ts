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
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async findAll(@Query('all') all?: string) {
    return this.itemsService.findAll(all === 'true');
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.itemsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body() dto: CreateItemDto) {
    return this.itemsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: string) {
    return this.itemsService.delete(id);
  }

  @Put(':id/toggle-availability')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async toggleAvailability(@Param('id') id: string) {
    return this.itemsService.toggleAvailability(id);
  }
}
