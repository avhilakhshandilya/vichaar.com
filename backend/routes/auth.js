import { Hono } from "hono";
const router = new Hono();

import * as ctrl from "../controllers/authController.js";

router.post('/signup', async (c) => {
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
  return await ctrl.signup(req, res);
});
router.post('/login', async (c) => {
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
  return await ctrl.login(req, res);
});

export default router;
