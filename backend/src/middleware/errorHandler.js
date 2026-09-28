const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  return res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' ? { error: err.stack } : {})
  });
};

module.exports = { notFound, errorHandler };
