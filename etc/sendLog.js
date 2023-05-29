const fetch = require('cross-fetch')

async function sendLog(msg, url = process.env.DISCORD_WEBHOOK) {
    console.log(msg, url)
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: msg
        })
    })
}

module.exports = sendLog