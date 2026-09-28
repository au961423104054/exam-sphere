const success = (res, data = {}, message = undefined, status = 200, extra = {}) => {
  const payload = {
    success: true,
    data,
    ...extra
  };
  if (message) payload.message = message;
  return res.status(status).json(payload);
};

const fail = (res, message, status = 400, extra = {}) => {
  return res.status(status).json({
    success: false,
    message,
    ...extra
  });
};

module.exports = { success, fail };
