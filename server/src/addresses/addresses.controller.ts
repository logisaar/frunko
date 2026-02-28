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
    Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

const MAPPLS_KEY = '2b64cd896d5489f55874b38e7b35537a';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) { }

    @Get('reverse-geocode')
    async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
        const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/rev_geocode?lat=${lat}&lng=${lng}`;
        const res = await fetch(url);
        const data = await res.json();
        return data;
    }

    @Get()
    async findAll(@Req() req: Request) {
        const user = req.user as { id: string };
        return this.addressesService.findByUser(user.id);
    }

    @Post()
    async create(@Req() req: Request, @Body() dto: CreateAddressDto) {
        const user = req.user as { id: string };
        return this.addressesService.create(user.id, dto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Req() req: Request,
        @Body() dto: UpdateAddressDto,
    ) {
        const user = req.user as { id: string };
        return this.addressesService.update(id, user.id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Req() req: Request) {
        const user = req.user as { id: string };
        return this.addressesService.delete(id, user.id);
    }

    @Put(':id/default')
    async setDefault(@Param('id') id: string, @Req() req: Request) {
        const user = req.user as { id: string };
        return this.addressesService.setDefault(id, user.id);
    }
}
