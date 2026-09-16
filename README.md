# Payments Microservice

Microservicio de pagos de la [tienda de microservicios](https://github.com/Nest-Microservices-AndresGach/products-launcher).
Crea las sesiones de pago en Stripe y recibe el webhook de confirmación. Es el único
servicio, además del gateway, que necesita exponer un puerto al exterior: Stripe tiene
que poder alcanzarlo.

> **Desarrollado en septiembre de 2025.** Los commits de 2026 son mantenimiento
> (actualización de dependencias por vulnerabilidades).

## Responsabilidades

- **Sesiones de pago**: a petición de `orders-ms`, crea un Checkout Session de Stripe
  y devuelve la URL de pago
- **Webhook**: recibe los eventos de Stripe, verifica la firma con el signing secret y
  notifica a `orders-ms` para que marque la orden como pagada

La verificación de firma es lo que impide que cualquiera pueda fabricar una
confirmación de pago falsa, por lo que el `STRIPE_ENDPOINT_SECRET` se lee siempre
desde variables de entorno.

**Stack:** NestJS · TypeScript · NATS · Stripe

## Desarrollo

1. Clonar el repositorio e instalar dependencias:

```bash
npm install
```

2. Crear un `.env` basado en `.env.template` con tus claves de Stripe.

3. Levantar NATS y arrancar el servicio:

```bash
npm run start:dev
```

4. Para probar el webhook en local, redirigir los eventos con la CLI de Stripe:

```bash
stripe listen --forward-to localhost:3003/payments/webhook
```

## Producción

```bash
docker build -f dockerfile.prod -t payments-ms .
```

---

Forma parte del proyecto [products-launcher](https://github.com/Nest-Microservices-AndresGach/products-launcher),
donde está la arquitectura completa y el despliegue con Docker Compose y Kubernetes.
