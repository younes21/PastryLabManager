import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { createApp } from './helpers/test-app';

describe('Production Summary - Unit-ish (isolated endpoint behavior with small fixtures)', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  it('allocates stock across all orders, aggregates only filtered ones', async () => {
    // Seed minimal data via existing API endpoints where possible
    // NOTE: The project commonly relies on in-memory storage in tests via routes register
    // Create two clients
    const c1 = await request(app).post('/api/clients').send({
      code: 'CLI-001', type: 'particulier', firstName: 'X', lastName: 'A', email: 'x@example.com'
    });
    const clientXId = c1.body.id;
    const c2 = await request(app).post('/api/clients').send({
      code: 'CLI-002', type: 'particulier', firstName: 'Y', lastName: 'B', email: 'y@example.com'
    });
    const clientYId = c2.body.id;

    // Create a product with initial stock 15
    const art = await request(app).post('/api/articles').send({
      name: 'Croissant', type: 'product', unit: 'pcs', allowSale: true, managedInStock: true, currentStock: '15.000'
    });
    const articleId = art.body.id;

    // Create two active orders in priority order: X then Y
    const oX = await request(app).post('/api/orders').send({
      type: 'order', clientId: clientXId, status: 'confirmed', order: 1
    });
    const orderXId = oX.body.id;
    await request(app).post(`/api/orders/${orderXId}/items`).send([
      { articleId, quantity: '10.000', unitPrice: '0.00', totalPrice: '0.00' }
    ]);

    const oY = await request(app).post('/api/orders').send({
      type: 'order', clientId: clientYId, status: 'confirmed', order: 2
    });
    const orderYId = oY.body.id;
    await request(app).post(`/api/orders/${orderYId}/items`).send([
      { articleId, quantity: '10.000', unitPrice: '0.00', totalPrice: '0.00' }
    ]);

    // Query production-summary filtered to client Y
    const res = await request(app)
      .get('/api/orders/production-summary')
      .query({ clientId: clientYId })
      .expect(200);

    // Expect: ordered for Y = 10, toPick = 5 (15 stock - 10 reserved by X = 5), toProduce = 5
    const row = res.body.find((r: any) => r.articleId === articleId);
    expect(row).toBeTruthy();
    expect(row.ordered).toBeCloseTo(10, 6);
    expect(row.toPick).toBeCloseTo(5, 6);
    expect(row.toProduce).toBeCloseTo(5, 6);
  });
});


