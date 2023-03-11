const supabase = require('../db')

async function sendNotification(a) {
    var dat = a
    dat['timestamp'] = Date.now()
    var { data, error } = await supabase
        .from('notifications')
        .insert(dat)
    console.log(data, error)
}

module.exports = sendNotification