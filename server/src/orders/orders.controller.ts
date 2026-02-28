import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get()
  async findByUser(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.ordersService.findByUser(user.id);
  }

  @Get('all')
  @UseGuards(AdminGuard)
  async findAll() {
    return this.ordersService.findAll();
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  async getStats() {
    const [count, revenue, recent] = await Promise.all([
      this.ordersService.count(),
      this.ordersService.totalRevenue(),
      this.ordersService.recentOrders(),
    ]);
    return { count, revenue, recent };
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    const adminRoles = ['admin', 'super_admin', 'manager'];
    return this.ordersService.findById(
      id,
      adminRoles.includes(user.role) ? undefined : user.id,
    );
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateOrderDto) {
    const user = req.user as { id: string };
    return this.ordersService.create(user.id, dto);
  }

  @Put(':id/status')
  @UseGuards(AdminGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }
}
