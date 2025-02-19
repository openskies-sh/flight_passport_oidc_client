const express = require('express');
const router = express.Router();


const {  requiresAuth } = require('express-openid-connect');
router.get('/', requiresAuth(), async (req, res) => {
  const userInfo = await req.oidc.fetchUserInfo();
  res.render('users', { user: userInfo });
});
module.exports = router;