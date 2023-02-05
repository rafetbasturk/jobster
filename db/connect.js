const { set, connect } = require("mongoose")

const connectDB = async (uri) => {
  set('strictQuery', false)
  return connect(uri).then(() => console.log("Connected to DB"))
}

module.exports = connectDB