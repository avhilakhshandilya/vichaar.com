import { Hono } from "hono";
const router = new Hono();
import * as ctrl from "../controllers/marketController.js";

router.post('/vote', async (c) => {
  let statusCode = 200;
  const req = {
    body: await c.req.json().catch(()=>({})),
    params: c.req.param(),
    query: c.req.query(),
    headers: c.req.header(),
  };
  const res = {
    status: (code) => { statusCode = code; return res; },
    json: (data) => c.json(data, statusCode)
  };
  return await ctrl.vote(req, res);
});
router.post('/resolve', async (c) => {
  let statusCode = 200;
  const req = {
    body: await c.req.json().catch(()=>({})),
    params: c.req.param(),
    query: c.req.query(),
    headers: c.req.header(),
  };
  const res = {
    status: (code) => { statusCode = code; return res; },
    json: (data) => c.json(data, statusCode)
  };
  return await ctrl.resolveMarket(req, res);
});
router.post('/create', async (c) => {
  let statusCode = 200;
  const req = {
    body: await c.req.json().catch(()=>({})),
    params: c.req.param(),
    query: c.req.query(),
    headers: c.req.header(),
  };
  const res = {
    status: (code) => { statusCode = code; return res; },
    json: (data) => c.json(data, statusCode)
  };
  return await ctrl.createMarket(req, res);
});
router.get('/activity', async (c) => {
  let statusCode = 200;
  const req = {
    body: {},
    params: c.req.param(),
    query: c.req.query(),
    headers: c.req.header(),
  };
  const res = {
    status: (code) => { statusCode = code; return res; },
    json: (data) => c.json(data, statusCode)
  };
  return await ctrl.getActivityFeed(req, res);
});

export default router;
