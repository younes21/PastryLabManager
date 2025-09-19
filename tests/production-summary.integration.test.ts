import request from 'supertest';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { createApp } from './helpers/test-app';

describe('Production Summary - Integration', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  it('respects date filters and aggregates multiple products', async () => {
    // Create client
    const c = await request(app).post('/api/clients').send({
      code: 'CLI-010', type: 'particulier', firstName: 'D', lastName: 'E', email: 'de@example.com'
    });
    const clientId = c.body.id;

    // Create products
    const a1 = await request(app).post('/api/articles').send({
      name: 'Baguette', type: 'product', unit: 'pcs', allowSale: true, managedInStock: true, currentStock: '20.000'
    });
    const a2 = await request(app).post('/api/articles').send({
      name: 'Pain Choco', type: 'product', unit: 'pcs', allowSale: true, managedInStock: true, currentStock: '0.000'
    });

    // Two orders on different days
    const todayStr = new Date().toISOString();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();

    const o1 = await request(app).post('/api/orders').send({
      type: 'order', clientId, status: 'confirmed', order: 1, orderDate: todayStr
    });
    await request(app).post(`/api/orders/${o1.body.id}/items`).send([
      { articleId: a1.body.id, quantity: '12.000', unitPrice: '0.00', totalPrice: '0.00' },
      { articleId: a2.body.id, quantity: '8.000', unitPrice: '0.00', totalPrice: '0.00' }
    ]);

    const o2 = await request(app).post('/api/orders').send({
      type: 'order', clientId, status: 'confirmed', order: 2, orderDate: yesterdayStr
    });
    await request(app).post(`/api/orders/${o2.body.id}/items`).send([
      { articleId: a1.body.id, quantity: '5.000', unitPrice: '0.00', totalPrice: '0.00' }
    ]);

    // Filter today only
    const resToday = await request(app)
      .get('/api/orders/production-summary')
      .query({ date: 'today' })
      .expect(200);

    const rowBaguetteToday = resToday.body.find((r: any) => r.articleId === a1.body.id);
    const rowChocoToday = resToday.body.find((r: any) => r.articleId === a2.body.id);
    expect(rowBaguetteToday.ordered).toBeCloseTo(12, 6);
    expect(rowChocoToday.ordered).toBeCloseTo(8, 6);

    // Filter yesterday only
    const resYesterday = await request(app)
      .get('/api/orders/production-summary')
      .query({ date: 'yesterday' })
      .expect(200);

    const rowBaguetteYesterday = resYesterday.body.find((r: any) => r.articleId === a1.body.id);
    expect(rowBaguetteYesterday.ordered).toBeCloseTo(5, 6);
  });

  it('considers in-progress fabrication operations when reducing to-produce', async () => {
    // Create client
    const c = await request(app).post('/api/clients').send({
      code: 'CLI-020', type: 'particulier', firstName: 'F', lastName: 'G', email: 'fg@example.com'
    });
    const clientId = c.body.id;

    // Product with zero stock
    const art = await request(app).post('/api/articles').send({
      name: 'Brioche', type: 'product', unit: 'pcs', allowSale: true, managedInStock: true, currentStock: '0.000'
    });

    // Create an order requiring 10
    const order = await request(app).post('/api/orders').send({
      type: 'order', clientId, status: 'confirmed', order: 1
    });
    await request(app).post(`/api/orders/${order.body.id}/items`).send([
      { articleId: art.body.id, quantity: '10.000', unitPrice: '0.00', totalPrice: '0.00' }
    ]);

    // Create a fabrication operation in progress providing 6
    const op = await request(app).post('/api/inventory-operations').send({
      type: 'fabrication', status: 'en_cours'
    });
    await request(app).post(`/api/inventory-operations/${op.body.id}/items`).send([
      { articleId: art.body.id, quantity: '6.000' }
    ]);

    const res = await request(app)
      .get('/api/orders/production-summary')
      .expect(200);

    const row = res.body.find((r: any) => r.articleId === art.body.id);
    expect(row.ordered).toBeCloseTo(10, 6);
    expect(row.toPick).toBeCloseTo(0, 6); // No stock
    expect(row.toProduce).toBeCloseTo(4, 6); // 10 - 6 from operation
  });
});


