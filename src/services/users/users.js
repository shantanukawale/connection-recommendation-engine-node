const { v4: uuidv4 } = require('uuid')
const jwt = require("jsonwebtoken")
require("dotenv").config();

async function signUp(db, req, res) {
  const { name, email, password, cityUid } = req.body
  const errors = [];

  if (!name || typeof name != "string") errors.push("Invalid name in body")
  if (!email || typeof email != "string") errors.push("Invalid email in body")
  if (!password || typeof password != "string") errors.push("Invalid password in body")
  if (!cityUid || typeof cityUid != "string") errors.push("Invalid cityUid in body")

  if (errors.length) return res.status(400).send(errors);

  if (!(await db.collection('cities').find({ "uid": req.body.cityUid }).toArray()).length) {
    return res.status(404).send("cityUid not found")
  }

  try {
    await db.collection('users').insert({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      uid: uuidv4(),
      cityUid: req.body.cityUid
    })
  } catch (e) {
    console.error(e.writeErrors[0].errmsg)
    return res.status(503).send("Could Not Sign Up")
  }

  return res.send("Sign Up Successful!")
}

async function login(db, req, res) {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).send("Missing email or password!")

  if (!(await db.collection("users").find({ email, password }).toArray()).length) {
    return res.status(404).send("User not found")
  }

  const token = jwt.sign({ email }, process.env.JWT_KEY, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRY_SECONDS * 1000,
  })

  res.cookie("token", token, { maxAge: process.env.JWT_EXPIRY_SECONDS * 1000 })
  return res.status(200).send({ token })
}

async function updateUser(db, req, res) {
  const { authorization } = req.headers;
  const { name, password, cityUid, connections } = req.body;

  let payload
  try {
    payload = jwt.verify(authorization, process.env.JWT_KEY)
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return res.status(401).send("Invalid/Expired token. Please login again!")
    }
    return res.status(400).send('Bad Request')
  }

  const errors = [];

  if (name && typeof name != "string") errors.push("Invalid name in body")
  if (password && typeof password != "string") errors.push("Invalid password in body")

  if (cityUid && !(await db.collection('cities').find({ "uid": cityUid }).toArray()).length) {
    errors.push("cityUid not found")
  }

  if (connections && Array.isArray(connections) && (await db.collection('users').find({ uid: { '$in': connections } }).toArray()).length !== connections.length) {
    errors.push('Invalid connection uids in connections array')
  }

  if (errors.length) return res.status(400).send(errors);

  const setDetails = {}
  if (name) setDetails.name = name;
  if (password) setDetails.password = password;
  if (cityUid) setDetails.cityUid = cityUid;
  if (connections) setDetails.connections = connections;

  await db.collection('users').update({ email: payload.email }, { "$set": setDetails })
  return res.send("User details updated successfully").status(200)
}

async function getConnections(db, req, res) {
  const { authorization } = req.headers;
  const { depth } = req.query;
  let { city = [] } = req.query;
  if (!Array.isArray(city)) city = [city]
  let payload
  try {
    payload = jwt.verify(authorization, process.env.JWT_KEY)
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      return res.status(401).send("Invalid/Expired token. Please login again!")
    }
    return res.status(400).send('Bad Request')
  }

  const options = [
    { $match: { email: payload.email } },
    {
      $graphLookup: {
        from: "users",
        startWith: '$connections',
        connectFromField: 'connections',
        connectToField: 'uid',
        maxDepth: parseInt(depth) || 0,
        as: 'connections',
        depthField: "depth"
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        cityUid: 1,
        _id: 0,
        connections: 1
      }
    },
    {
      $lookup: {
        from: "cities",
        localField: "cityUid",
        foreignField: "uid",
        as: "currentCityDetails"
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ["$currentCityDetails", 0] }, "$$ROOT"]
        }
      }
    },
    {
      $lookup: {
        from: "cities",
        localField: "connections.cityUid",
        foreignField: "uid",
        as: "connectionCities"
      }
    },
    {
      $project: {
        _id: 0,
        name: 1,
        email: 1,
        geometry: 1,
        "connectionCities.uid": 1,
        "connections.name": 1,
        "connections.email": 1,
        "connections.uid": 1,
        "connections.cityUid": 1,
        "connections.depth": 1
      }
    }
  ]

  const userData = await db.collection('users').aggregate(options).toArray()

  if (!userData.length) return res.status(404).send("No Results Found.")

  const cities = city.length ? city : userData[0].connectionCities.map(item => item.uid)

  const cityInfo = await db.collection('cities').aggregate([
    {
      $geoNear: {
        near: userData[0].geometry,
        distanceField: "distFromOrigin",
        includeLocs: "geometry.coordinates"
      }
    },
    {
      $match: { uid: { $in: cities } }
    }
  ]).toArray()

  userData[0].connections = userData[0].connections.filter(item => item.depth > 0)

  const reco = []

  for (const connection of userData[0].connections) {
    for (const city of cityInfo) {
      if (connection.cityUid == city.uid) {
        reco.push({
          name: connection.name,
          email: connection.email,
          userId: connection.uid,
          cityUid: city.uid,
          distance: city.distFromOrigin,
          depth: connection.depth
        })
      }
    }
  }

  reco.sort((a, b) => a.distance - b.distance)

  return res.send(reco).status(200)
}

module.exports = {
  signUp,
  login,
  updateUser,
  getConnections
}