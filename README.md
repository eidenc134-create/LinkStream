# Lank MX Marketplace (MVP)

Marketplace de cupos para servicios digitales en México, con:
- Multi-vendedores
- Pagos por Mercado Pago (Checkout Pro)
- Comisión fija 10% (sale del ingreso del vendedor)
- Entrega segura por invitación email (sin contraseñas)
- Escrow 24h + disputas
- Reviews + métricas SLA
- Renovaciones internas (tabla lista)

## Setup
1) Crea proyecto en Supabase  
2) Ejecuta `sql/schema.sql` y luego `sql/migration_v2.sql` en el SQL editor  
3) Copia `.env.local.example` a `.env.local` y llena valores  
4) `npm i`  
5) `npm run dev`

## Verificación de vendedor (MVP)
Para publicar listings, marca al vendedor:
- Supabase -> tabla `profiles` -> columna `seller_verification` = 'verified'

## Cron escrow
Llama:
POST `/api/cron/escrow-release`
Header:
`x-job-secret: <INTERNAL_JOB_SECRET>`
cada 10-30 minutos.
