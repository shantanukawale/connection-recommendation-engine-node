const { getCities } = require("./services/cities/cities");
const { signUp, login, updateUser, getConnections } = require("./services/users/users");

module.exports = function (app) {
  app.get('/healthcheck', async (req, res) => {
    res.status(200).send('OK')
  })

  app.get('/cities', async (req, res) => {
    await getCities(app.locals.db, req, res);
  });

  app.post('/signup', async (req, res) => {
    await signUp(app.locals.db, req, res)
  })

  app.post('/login', async (req, res) => {
    await login(app.locals.db, req, res)
  })

  app.put('/update_user', async (req, res) => {
    await updateUser(app.locals.db, req, res)
  })

  app.post('/get_connections', async (req, res) => {
    await getConnections(app.locals.db, req, res)
  })
}