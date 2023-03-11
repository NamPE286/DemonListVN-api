const jwt = require('jsonwebtoken')
const supabase = require('../db')

async function checkAdmin(token) {
    try {
        jwt.verify(token, process.env.JWT_SECRET)
        user = jwt.decode(token)
        var { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('uid', user.sub)
            .single()
        return data
    }
    catch (err) {
        console.log(err)
        return false
    }
}

module.exports = checkAdmin