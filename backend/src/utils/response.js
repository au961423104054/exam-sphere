const success = (res, data = {}, message, status = 200) => {
  const payload = { success: true, data };
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
