require("dotenv").config()
require("express-async-errors")
const helmet = require("helmet")
const xss = require("xss-clean")
const express = require("express")
const path = require("path")

const jobRoutes = require("./routes/jobRouter")
const authRoutes = require("./routes/authRouter")
const { authenticate } = require("./middlewares/authentication")
const { notFound } = require("./middlewares/not-found")
const { errorHandler } = require("./middlewares/error-handler")
const connectDB = require("./db/connect")

const app = express()

app.set('trust proxy', 1);

app.use(express.static(path.resolve(__dirname, "public")))
app.use(express.json())
app.use(helmet())
app.use(xss())

//routers
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/jobs", authenticate, jobRoutes)

app.use("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"))
})

app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || 3000

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    app.listen(port, () => {
      console.log(`Server listening on port ${port}...`);
    })
  } catch (error) {
    console.log(error);
  }
}

start()