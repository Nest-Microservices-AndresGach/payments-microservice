import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency: currency,
          product_data: {
            // * En vez de product_data la libreria de stripe deja colocar product que se refiere a otros productos que tengamos ya creados en stripe
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // 20 dólares = 2000 / 100 = 20.00      // 15.0000
        },
        quantity: item.quantity,
      };
    });
    const session = await this.stripe.checkout.sessions.create({
      //Colocar aquí el ID de mi orden
      payment_intent_data: {
        metadata: {
          orderId: orderId,
        },
      },

      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success',
      cancel_url: 'http://localhost:3003/payments/cancel',
    });
    return session;
  }

  async stripeWebhook(req: Request, res: Response) {
    const signature = req.headers['stripe-signature'] as string; // * EL 'as string' no iba pero como el objeto no sabe de que tipo es, lo fuerzo para que funcione

    let event: Stripe.Event;
    // * ENPOINT DE TESTING
    // const endpointSecret =
    //   'whsec_c20faadd63bdeb42dd049745b285d1d12fb9b346281caaf785079a02e78c0a54';

    // ENDPOINT REAL
    const endpointSecret = 'whsec_SGoKeA2pvw6J0HVw5qp5xvk6gwARhIWR';
    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        signature,
        endpointSecret,
      );
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }
    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        // TODO: Llamar nuestro microservicio
        console.log({
          metadata: chargeSucceeded.metadata,
          orderId: chargeSucceeded.metadata.orderId,
        });
        break;

      default:
        console.log(`Event ${event.type} not handled`);
    }
    return res.status(200).send({ signature });
  }
}
