"use strict";

const notFound = (req, res, next) => {
  const error = new Error(`Not Found = ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode ? res.statusCode : 500;
  let message;

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found!";
  }
  res.status(statusCode);
  res.json({
    message: err.message,
    isError: true,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
  console.log(err.stack);
};

module.exports = { notFound, errorHandler };
