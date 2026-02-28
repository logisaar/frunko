import {
    Controller,
    Post,
    Body,
    Req,
    Res,
    UseGuards,
    Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaytmService } from './paytm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ConfigService } from '@nestjs/config';

@Controller('paytm')
export class PaytmController {
    private readonly logger = new Logger(PaytmController.name);

    constructor(
        private readonly paytmService: PaytmService,
        private readonly config: ConfigService,
    ) { }

    @Post('initiate')
    @UseGuards(JwtAuthGuard)
    async initiatePayment(
        @Body() dto: InitiatePaymentDto,
        @Req() req: Request,
    ) {
        const user = req.user as { id: string; email?: string };
        return this.paytmService.initiateTransaction(
            dto.orderId,
            dto.amount,
            user.id,
            dto.email || user.email,
            dto.phone,
        );
    }

    @Post('callback')
    async handleCallback(@Body() body: Record<string, string>, @Res() res: Response) {
        this.logger.log('Paytm callback hit');

        const result = await this.paytmService.handleCallback(body);
        const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:8081');

        if (result.success) {
            res.redirect(
                `${frontendUrl}/payment?status=success&orderId=${result.paytmOrderId}&txnId=${result.txnId}`,
            );
        } else {
            res.redirect(
                `${frontendUrl}/payment?status=failed&orderId=${result.paytmOrderId}`,
            );
        }
    }
}
