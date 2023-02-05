const { Router } = require("express")
const { register, login, updateUser } = require("../controllers/authController")
const { authenticate } = require("../middlewares/authentication")
const { testUser } = require("../middlewares/test-user")
const rateLimiter = require("express-rate-limit")

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    msg: 'Too many requests from this IP, please try again after 15 minutes'
  }
})

const router = Router()

router.post("/register", limiter, register)
router.post("/login", limiter, login)

router.patch("/updateUser", authenticate, testUser, updateUser)

module.exports = router