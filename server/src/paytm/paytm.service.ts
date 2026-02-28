import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as PaytmChecksum from 'paytmchecksum';

@Injectable()
export class PaytmService {
    private readonly logger = new Logger(PaytmService.name);
    private readonly mid: string;
    private readonly merchantKey: string;
    private readonly website: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {
        this.mid = this.config.get<string>('PAYTM_MID', '');
        this.merchantKey = this.config.get<string>('PAYTM_MERCHANT_KEY', '');
        this.website = this.config.get<string>('PAYTM_WEBSITE', 'DEFAULT');
    }

    async initiateTransaction(
        orderId: string,
        amount: number,
        customerId: string,
        email?: string,
        phone?: string,
    ) {
        const paytmOrderId = `FRUNKO_${orderId.slice(-8)}_${Date.now()}`;

        const paytmBody: Record<string, any> = {
            requestType: 'Payment',
            mid: this.mid,
            websiteName: this.website,
            orderId: paytmOrderId,
            callbackUrl: `http://localhost:${this.config.get('PORT', '3001')}/api/paytm/callback`,
            txnAmount: {
                value: parseFloat(amount.toString()).toFixed(2),
                currency: 'INR',
            },
            userInfo: {
                custId: customerId,
                ...(email && { email }),
                ...(phone && { mobile: phone }),
            },
        };

        const checksum = await PaytmChecksum.generateSignature(
            JSON.stringify(paytmBody),
            this.merchantKey,
        );

        const paytmParams = {
            body: paytmBody,
            head: { signature: checksum },
        };

        const paytmUrl = `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${this.mid}&orderId=${paytmOrderId}`;

        this.logger.log(`Initiating Paytm txn for order ${orderId} → paytmOrderId: ${paytmOrderId}`);

        const response = await fetch(paytmUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paytmParams),
        });

        const data = await response.json();

        if (!data.body?.txnToken) {
            this.logger.error('Paytm initiate failed:', JSON.stringify(data));
            throw new Error(data.body?.resultInfo?.resultMsg || 'Failed to initiate Paytm transaction');
        }

        // Save paytmOrderId on our order record
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                paytmOrderId,
                paymentMethod: 'paytm',
                paymentStatus: 'pending',
            },
        });

        return {
            orderId: paytmOrderId,
            txnToken: data.body.txnToken,
            mid: this.mid,
            amount: parseFloat(amount.toString()).toFixed(2),
        };
    }

    async handleCallback(paytmResponse: Record<string, string>) {
        this.logger.log(`Paytm callback received: ${JSON.stringify(paytmResponse)}`);

        // Verify checksum
        const paramsForVerification = { ...paytmResponse };
        const checksumReceived = paramsForVerification.CHECKSUMHASH;
        delete paramsForVerification.CHECKSUMHASH;

        let isValid = false;
        try {
            isValid = PaytmChecksum.verifySignature(
                paramsForVerification,
                this.merchantKey,
                checksumReceived,
            );
        } catch (e) {
            this.logger.error('Checksum verification error:', e);
        }

        const paytmOrderId = paytmResponse.ORDERID;
        const status = paytmResponse.STATUS;
        const txnId = paytmResponse.TXNID;

        if (isValid && status === 'TXN_SUCCESS') {
            // Payment success — update order
            await this.prisma.order.update({
                where: { paytmOrderId },
                data: {
                    paymentStatus: 'paid',
                    paytmTxnId: txnId,
                    paidAt: new Date(),
                },
            });

            return { success: true, paytmOrderId, txnId };
        } else {
            // Payment failed
            await this.prisma.order.updateMany({
                where: { paytmOrderId },
                data: {
                    paymentStatus: 'failed',
                    paytmTxnId: txnId || null,
                },
            });

            return { success: false, paytmOrderId, status };
        }
    }
}
