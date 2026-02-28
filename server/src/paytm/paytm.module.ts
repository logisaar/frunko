import { Module } from '@nestjs/common';
import { PaytmController } from './paytm.controller';
import { PaytmService } from './paytm.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PaytmController],
    providers: [PaytmService],
})
export class PaytmModule { }
