import { Hono } from "hono";
const router = new Hono();
import * as ctrl from "../controllers/commentController.js";

router.post('/', async (c) => {
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
  return await ctrl.addComment(req, res);
});
router.get('/:market_id', async (c) => {
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
  return await ctrl.getComments(req, res);
});

export default router;
