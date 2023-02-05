const mongoose = require('mongoose');
const moment = require('moment');
const Job = require("../models/jobModel")
const { StatusCodes } = require("http-status-codes")
const BadRequestError = require("../errors/bad-request")
const NotFoundError = require("../errors/not-found")

exports.getAllJobs = async (req, res) => {
  const { search, status, jobType, sort } = req.query

  const queryObject = {
    createdBy: req.user.userId,
  };

  if (search) {
    queryObject.position = { $regex: search, $options: 'i' };
  }

  if (status && status !== 'all') {
    queryObject.status = status;
  }
  if (jobType && jobType !== 'all') {
    queryObject.jobType = jobType;
  }

  // no await
  let result = Job.find(queryObject)

  // chain sort conditions
  if (sort === 'latest') {
    result = result.sort('-createdAt');
  }
  if (sort === 'oldest') {
    result = result.sort('createdAt');
  }
  if (sort === 'a-z') {
    result = result.sort('position');
  }
  if (sort === 'z-a') {
    result = result.sort('-position');
  }

  // setup pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);
  const jobs = await result

  const totalJobs = await Job.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalJobs / limit);

  res.status(StatusCodes.OK).json({
    totalJobs,
    numOfPages,
    jobs
  })
}

exports.getJob = async (req, res) => {
  const { params: { id: jobId }, user: { userId } } = req

  const job = await Job.findOne({ createdBy: userId, _id: jobId })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}!`)
  }
  res.status(StatusCodes.OK).json({
    job
  })
}

exports.createJob = async (req, res) => {
  const job = await Job.create({
    ...req.body,
    createdBy: req.user.userId
  })

  res.status(StatusCodes.CREATED).json({
    job
  })
}

exports.updateJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
    body: { company, position }
  } = req
  if (company === "" || position === "") {
    throw new BadRequestError("Company and position fields cannot be empty!")
  }
  const job = await Job.findOneAndUpdate({ _id: jobId, createdBy: userId }, req.body, {
    new: true,
    runValidators: true
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}!`)
  }
  res.status(StatusCodes.OK).json({
    job
  })
}

exports.deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req
  const job = await Job.findOneAndDelete({ _id: jobId, createdBy: userId })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}!`)
  }
  res.status(StatusCodes.OK).send()
}

exports.showStats = async (req, res) => {
  let stats = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ])
  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {})

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  let monthlyApplications = await Job.aggregate([
    {
      $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        "_id.year": -1,
        "_id.month": -1
      }
    },
    {
      $limit: 6
    }
  ])

  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      const date = moment()
        .month(month - 1)
        .year(year)
        .format('MMM Y');
      return { date, count };
    })
    .reverse();

  res.status(StatusCodes.OK).json({
    defaultStats,
    monthlyApplications
  });
}