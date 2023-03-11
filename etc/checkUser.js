const jwt = require('jsonwebtoken')
const supabase = require('../db')

function checkUser(token, uid) {
    try {
        jwt.verify(token, process.env.JWT_SECRET)
        user = jwt.decode(token)
        return user.sub == uid
    }
    catch (err) {
        return false
    }
}

module.exports = checkUser