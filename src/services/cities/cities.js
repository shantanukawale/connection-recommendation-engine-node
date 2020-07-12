
async function getCities(db, req, res) {
  const cities = await db.collection("cities")
    .find({}, { "_id": 0 })
    .sort([['_id', 1]])
    .toArray()

  if (!cities.length) res.status(404).send('No cities found!');

  cities.forEach(item => {
    delete item._id
    delete item.geometry
  })

  return res.send(cities)
}

module.exports = {
  getCities
}