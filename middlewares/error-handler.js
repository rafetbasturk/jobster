const { StatusCodes } = require("http-status-codes")

exports.errorHandler = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong! Try again later."
  }
  if (err.code && err.code === 11000) {
    customError.statusCode = StatusCodes.BAD_REQUEST
    customError.msg = `Duplicate value in ${Object.keys(err.errors)} field! Please provide a different value.`
  }
  if (err.name === "ValidationError") {
    customError.statusCode = StatusCodes.BAD_REQUEST
    customError.msg = Object.values(err.errors).map(item => item.message).join(" ")
  }
  if (err.name === "CastError") {
    customError.statusCode = StatusCodes.NOT_FOUND
    customError.msg = `No item found with id: ${err.value}`
  }
  res.status(customError.statusCode).json({ msg: customError.msg })
}