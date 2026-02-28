import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async findAll() {
    return this.reviewsService.findAll();
  }

  @Get('item/:itemId')
  async findByItem(@Param('itemId') itemId: string) {
    return this.reviewsService.findByItem(itemId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: Request, @Body() dto: CreateReviewDto) {
    const user = req.user as { id: string };
    return this.reviewsService.create(user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string; role: string };
    const adminRoles = ['admin', 'super_admin', 'manager'];
    return this.reviewsService.delete(
      id,
      user.id,
      adminRoles.includes(user.role),
    );
  }
}
