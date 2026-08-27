async function getMe(req, res) {
  res.status(200).json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      location: req.user.location
    }
  });
}

module.exports = {
  getMe
};