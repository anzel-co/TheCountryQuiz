const jwt = require('jsonwebtoken')
const HttpError = require('./http-error.js')

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next()
    }
    try {
        const token = req.headers.authorization.split(' ')[1]

        if (!token) return next(new HttpError('You are not authorized.', 401))

        const payloadToken = jwt.verify(token, process.env.JWT_KEY)
        req.userName = { name: payloadToken.name }
        next();
    } catch (error) {
        return next(new HttpError('You are not authorized.', 401))
    }
}