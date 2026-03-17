const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500 ? 'Internal server error' : error.message;

  return res.status(statusCode).json({ message });
};

module.exports = errorMiddleware;
