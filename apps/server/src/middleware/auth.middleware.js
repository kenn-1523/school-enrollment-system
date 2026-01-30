const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).send({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).send({ message: 'Invalid token' });
    }
};

module.exports = { authenticateJWT };