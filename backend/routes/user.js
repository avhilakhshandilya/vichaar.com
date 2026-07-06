import { Hono } from "hono";
const router = new Hono();
import * as ctrl from "../controllers/userController.js";

router.post('/claim-bonus', async (c) => {
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
  return await ctrl.claimDailyBonus(req, res);
});
router.get('/portfolio/:user_id', async (c) => {
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
  return await ctrl.getPortfolio(req, res);
});
router.get('/leaderboard', async (c) => {
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
  return await ctrl.getLeaderboard(req, res);
});
router.get('/profile/:username', async (c) => {
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
  return await ctrl.getPublicProfile(req, res);
});
router.post('/profile/update', async (c) => {
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
  return await ctrl.updateProfile(req, res);
});
router.post('/profile/email', async (c) => {
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
  return await ctrl.updateEmail(req, res);
});
router.post('/profile/password', async (c) => {
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
  return await ctrl.updatePassword(req, res);
});
router.get('/notifications', async (c) => {
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
  return await ctrl.getNotifications(req, res);
});
router.post('/notifications/read', async (c) => {
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
  return await ctrl.markNotificationsRead(req, res);
});

export default router;
