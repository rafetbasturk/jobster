const { Router } = require("express")
const { getAllJobs, getJob, createJob, updateJob, deleteJob, showStats } = require("../controllers/jobController")
const { testUser } = require("../middlewares/test-user")

const router = Router()

router
  .route("/")
  .get(getAllJobs)
  .post(testUser, createJob)

router.route('/stats').get(showStats)

router
  .route("/:id")
  .get(getJob)
  .patch(testUser, updateJob)
  .delete(testUser, deleteJob)

module.exports = router