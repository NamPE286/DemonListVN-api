const express = require('express')
var cors = require('cors')
const jwt = require('jsonwebtoken')
const app = express()
const fetch = require('cross-fetch')
const cron = require('node-cron');

require('dotenv').config()
const redisEnabled = JSON.parse(process.env.ENABLE_REDIS)
console.log(redisEnabled)
var redisClient;
if (redisEnabled) {
    redisClient = require('redis').createClient({
        socket: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,

        }, password: process.env.REDIS_PASSWORD
    })
    async function redisConnect() {
        await redisClient.connect()
    }
    redisConnect()
}

const PORT = process.env.PORT || 5050
const supabase = require('@supabase/supabase-js').createClient(process.env.API_URL, process.env.API_KEY)

const checkAdmin = require('./etc/checkAdmin')
const checkUser = require('./etc/checkUser')
const getCreator = require('./etc/getCreator')
const getLevel = require('./etc/getLevel')
const sendLog = require('./etc/sendLog')
const sendNotification = require('./etc/sendNotification')

cron.schedule('0 0 * * *', async () => {
    const { error } = await supabase.rpc('updateRank')
    console.log(error)
    console.log("Updated players rank")
});


app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    console.log('server ok')
    res.status(200).send({ message: 'server ok' })
})

app.get('/provinces', (req, res) => {
    res.status(200).send(require('./provinces.json'))
})

app.get('/level/:id', async (req, res) => {
    const { id } = req.params
    const data = await require('./src/level/id/GET')(id)
    if(!data) {
        res.status(404).send({message: 'Level does not exist.'})
        return
    }
    res.status(200).send(data)
})

app.delete('/level/:id', async (req, res) => {
    const { token } = req.body
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })

            return
        }
        const { id } = req.params
        var { data, error } = await supabase
            .from('submissions')
            .delete()
            .match({ levelid: id })
        var { data, error } = await supabase
            .from('records')
            .delete()
            .match({ levelid: id })
        var { data, error } = await supabase
            .from('levels')
            .delete()
            .match({ id: id })
        res.status(200).send()
        await supabase.rpc('updateList')
        if (redisEnabled) redisClient.flushAll('ASYNC', () => { })
        sendLog(`${user.name} (${user.uid}) deleted ${id}`)
    })
})

app.delete('/level/:id/song', async (req, res) => {
    const { id } = req.params
    const { token } = req.body
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })

            return
        }

        var { data, error } = await supabase
            .from('levels')
            .select('*')
            .eq('id', id)
            .single()
        
        level = data

        if (level.songID == null) {
            res.status(500).send();
            return
        }

        var { data, error } = await supabase
            .storage
            .from("songs")
            .remove([`${level.songID}.mp3`]);
        level.songID = null

        var { data, error } = await supabase
            .from('levels')
            .update(level)
            .match({ id: level.id })
        res.status(200).send()
        sendLog(`${user.name} (${user.uid}) deleted ${id} song`)
    })
})

app.post('/level/:id', (req, res) => {
    var { token } = req.body
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })
            return
        }
        const { id } = req.params
        var level = {
            name: null,
            creator: null,
            videoID: null,
            minProgress: null,
            flTop: null,
            rating: null,
        }
        var { data } = req.body
        for (const i in data) {
            if (i in level) {
                level[i] = data[i]
            }
        }
        if (level.flTop != null) level.flTop -= 0.5
        level.id = parseInt(id)
        var { data, error } = await supabase
            .from('levels')
            .insert(level)
        if (error) {
            res.status(500).send(error)
            return
        }
        if (error) {
            res.status(500).send(error)
            return
        }
        res.status(200).send(level)
        await supabase.rpc('updateList')
        if (redisEnabled) redisClient.flushAll('ASYNC', () => { })
        sendLog(`${user.name} (${user.uid}) added ${level.name} (${id})`)
    })
})

app.patch('/level/:id', (req, res) => {
    const { token } = req.body
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })
            return
        }
        var level = {
            name: null,
            creator: null,
            videoID: null,
            minProgress: null,
            flTop: null,
            dlTop: null,
            rating: null,
            songID: null,
        }
        const { id } = req.params
        var data = req.body.data

        if (data.flTop == null) { }
        else if (data.flTop < data.prevflTop) data.flTop -= 0.5
        else if (data.flTop > data.prevflTop) data.flTop += 0.5

        for (const i in data) {
            if (i in level) {
                level[i] = data[i]
            }
        }
        if (level.minProgress < 1) level.minProgress = 100
        level.id = parseInt(id)
        var { data, error } = await supabase
            .from('levels')
            .update(level)
            .match({ id: level.id })
        if (error) {
            res.status(500).send(error)
            return
        }

        if (error) {
            res.status(500).send(error)
            return
        }
        sendLog(`${user.name} (${user.uid}) modified ${level.name} (${id})`)
        res.status(200).send(level)
        await supabase.rpc('updateList')
        if (redisEnabled) redisClient.flushAll('ASYNC', () => { })
    })
})


async function getLevelsList(req, res) {
    const { id, list } = req.params
    const filter = {
        minTop: 0,
        maxTop: 1000,
        minPt: 0,
        maxPt: 10000,
    }
    var reqFilter
    try {
        reqFilter = JSON.parse(req.params.filter)
        delete reqFilter.hideBeatenLevels
        if (Object.keys(reqFilter).length == 0) reqFilter = null
    }
    catch {
        reqFilter = null
    }
    console.log(reqFilter, filter)
    if (!reqFilter || reqFilter == filter) {
        console.log('ok')
        var listPtName = list == 'dl' ? 'rating' : `${list}Pt`
        var cachedData;
        if (redisEnabled) {
            cachedData = await redisClient.get(`${list}Levels${id}`)
        }
        if (cachedData) {
            console.log('cache hit')
            return {
                error: null,
                data: cachedData
            }
        }
        else {
            console.log('cache miss')
            var { data, error } = await supabase
                .from('levels')
                .select('*')
                .order(`${list}Top`, { ascending: true })
                .range((id - 1) * 300, id * 300 - 1)
                .not(`${list}Top`, 'is', null)

            if (error) {
                return {
                    error: error,
                    data: null
                }
            }
            if (redisEnabled) redisClient.set(`${list}Levels${id}`, JSON.stringify(data))
            return {
                error: null,
                data: data
            }
        }
    }
    else {
        console.log('meh')
        if ('filter' in req.params) {
            for (i in filter) {
                if (i in reqFilter) {
                    filter[i] = reqFilter[i]
                }
            }
        }
        var listPtName = list == 'dl' ? 'rating' : `${list}Pt`
        var { data, error } = await supabase
            .from('levels')
            .select('*')
            .order(`${list}Top`, { ascending: true })
            .range((id - 1) * 300, id * 300 - 1)
            .not(`${list}Top`, 'is', null)
            .gte(`${list}Top`, filter.minTop)
            .lte(`${list}Top`, filter.maxTop)
            .gte(listPtName, filter.minPt)
            .lte(listPtName, filter.maxPt)

        if (error) {
            return {
                error: error,
                data: null
            }
        }
        return {
            error: null,
            data: data
        }
    }

}

app.get('/levels/:list/page/:id/:uid?/:filter?', async (req, res) => {
    console.log('oge')
    const { uid } = req.params
    console.log(req.params)
    const lvList = await getLevelsList(req, res)
    if (lvList.error) {
        res.status(404).send(lvList.error)
        return
    }
    if (!uid || uid == "0") {
        res.status(200).send(lvList.data)
        return
    }
    var result = lvList.data
    var { data, error } = await supabase
        .from('records')
        .select('userid, levelid, progress')
        .eq('userid', uid)
        .eq('isChecked', true)
    var mp = {}
    for (const i of data) {
        mp[i.levelid] = i
    }
    for (const i of result) {
        i['progress'] = 0
        if (mp.hasOwnProperty(i.id)) i['progress'] = mp[i.id].progress
    }
    if (req.params.filter && req.params.filter['hideBeatenLevels']) {
        const res = []
        for (const i of result) {
            if (i.progress != 100) res.push(i)
        }
        result = res
    }
    res.status(200).send(result)
})
app.get('/player/:id', async (req, res) => {
    const { id } = req.params
    const data = await require('./src/player/GET')(id)
    if(!data) {
        res.status(404).send({message: 'Player does not exist.'})
        return
    }
    res.status(200).send(data)
})
app.get('/player/:id/submissions', async (req, res) => {
    const { id } = req.params
    var { data, error } = await supabase
        .from('records')
        .select('*, levels(name)')
        .eq('userid', id)
        .eq('isChecked', false)
        .order("timestamp", { ascending: false })
    console.log(data, error)
    res.status(200).send(data)
})
app.get('/player/:id/records/:order', async (req, res) => {
    const { id, order } = req.params
    var { data, error } = await supabase
        .from('records')
        .select('*, levels(name, creator)')
        .eq('userid', id)
        .eq('isChecked', true)
        .order(order, { ascending: false })
    if(!data) {
        res.status(404).send({message: 'No record for this player.'})
    }
    res.status(200).send(data);
})
app.get('/players/rating/page/:id', async (req, res) => {
    const { id } = req.params
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order(`rating`, { ascending: false })
        .range((id - 1) * 300, id * 300 - 1)
        .not(`rating`, 'is', null)
        .gte('rating', 0.1)
        .match({ isHidden: false })
    if (error) {
        res.status(400).send(error)
        return
    }
    res.status(200).send(data)
})
app.get('/players/:list/page/:id', async (req, res) => {
    const { id, list } = req.params
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order(`${list}rank`, { ascending: true })
        .range((id - 1) * 300, id * 300 - 1)
        .not(`${list}rank`, 'is', null)
        .match({ isHidden: false })
    if (error) {
        res.status(400).send(error)
        return
    }
    res.status(200).send(data)
})
app.patch('/player/:id', async (req, res) => {
    const { id } = req.params
    var { token, data } = req.body
    a = data
    console.log(token, id)
    if (!checkUser(token, id)) {
        res.status(403).send({})
        console.log('ok')
        return
    }
    user = jwt.decode(token)
    delete data.isAdmin
    console.log(data)
    a['uid'] = user.sub
    var { data, error } = await supabase
        .from('players')
        .upsert(a)
    console.log(data, error)
    res.status(200).send(data)
    if (a.isHidden) await supabase.rpc('updateRank')

})
app.get('/search/:id', async (req, res) => {
    var { id } = req.params
    console.log(id)
    if (isNaN(id)) {
        console.log('ok')
        var cachedData
        if (redisEnabled) cachedData = await redisClient.get(`search?${id}`)
        if (cachedData) {
            console.log('cache hit')
            res.status(200).send(cachedData)
            return
        }
        console.log('cache miss')
        var m = {}
        var { data, error } = await supabase
            .from('levels')
            .select('*')
            .ilike('name', `%${id}%`)
        for (var i = 0; i < data.length; i++) {
            m[data[i].id] = data[i]
        }
        var { data, error } = await supabase
            .from('players')
            .select('name, uid, isHidden')
            .ilike('name', `%${id}%`)
            .eq('isHidden', false)
        var players = []
        for (var i = 0; i < data.length; i++) {
            players.push({
                id: data[i].uid,
                name: data[i].name
            })
        }
        var list = []
        for (const i in m) {
            list.push(m[i])
        }
        res.status(200).send([list, players])
        if (redisEnabled) redisClient.set(`search?${id}`, JSON.stringify([list, players]))
    }
    else {
        var { data, error } = await supabase
            .from('levels')
            .select('*')
            .eq('id', id)
        res.status(200).send([data, []])
    }
})
app.put('/record', async (req, res) => {
    var { token } = req.body
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })
            return
        }
        var record = req.body.data
        var { data, error } = await supabase
            .from('levels')
            .select('name')
            .match({ id: record.levelid })
            .single()
        var lvName = data.name
        var { data, error } = await supabase
            .from('players')
            .select('name')
            .match({ uid: record.userid })
            .single()
        var playerName = data.name
        sendLog(`${user.name} (${user.uid}) modified ${playerName}'s (${record.userid}) ${lvName} (${record.levelid}) record`)
        sendNotification({
            'to': record.userid,
            'content': `Your record of ${lvName} has been modified by a moderator`
        })
        delete record.players
        delete record.levels
        var { data, error } = await supabase
            .from('records')
            .upsert(record)
        if (error) {
            res.status(500).send(error)
            console.log(error)
            return
        }
        res.status(200).send(data)
    })
})
app.delete('/record/:userid/:levelid', async (req, res) => {
    const { token } = req.body
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })
            return
        }
        const { userid, levelid } = req.params
        var { data, error } = await supabase
            .from('records')
            .select('*, players!inner(name, uid), levels!inner(name, id)')
            .match({ userid: userid, levelid: levelid })
            .single()
        sendLog(`${user.name} (${user.uid}) deleted ${data.players.name}'s (${data.players.uid}) ${data.levels.name} (${data.levels.id}) record`)
        sendNotification({
            'to': data.players.uid,
            'content': `Your record of ${data.levels.name} has been deleted (rejected) by a moderator`
        })
        var { data, error } = await supabase
            .from('records')
            .delete()
            .match({ userid: userid, levelid: levelid })
        if (error) {
            res.status(500).send(error)
            return
        }

        res.status(200).send({})
    })
})
app.post('/player', async (req, res) => {
    var { token } = req.body
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })
            return
        }
        player = req.body.data
        var { data, error } = await supabase.from("players").insert(player)
        if (error) {
            res.status(500).send(error)
            return
        }
        res.status(200).send({
            message: 'ok'
        })
    })
})
app.post('/submit/:newLevel', async (req, res) => {
    console.log('received')
    var newLevel = parseInt(req.params.newLevel)
    req.body['isChecked'] = false
    var { data, error } = await supabase
        .from("records")
        .select('progress, isChecked, refreshRate')
        .match({ userid: req.body.userid, levelid: req.body.levelid })
        .single()
    console.log(data, error)
    if (data && data.isChecked) {
        if (data.progress > req.body.progress) {
            res.status(400).send({
                error: 'Record is already exists. Submission cancelled'
            })
            return
        }
        if (data.progress == req.body.progress && data.refreshRate <= req.body.refreshRate) {
            res.status(400).send({
                error: 'Record is already exists. Submission cancelled'
            })
            return
        }

    }
    var { data, error } = await supabase.from("records").upsert(req.body);
    console.log(data, error)
    if (error) {
        if (newLevel) {
            var lv
            try {
                const apilv = await getLevel(req.body.levelid)
                const creator = await getCreator(apilv.creatorUserID)
                if (!apilv || !creator) {
                    lv = {
                        id: req.body.levelid,
                        name: "Cannot retrieve data, please edit this field",
                        creator: "Cannot retrieve data, please edit this field",
                    }
                }
                else lv = {
                    id: req.body.levelid,
                    name: apilv.name,
                    creator: creator.nick,
                }
            }
            catch {
                lv = {
                    id: req.body.levelid,
                    name: "Cannot retrieve data, please edit this field",
                    creator: "Cannot retrieve data, please edit this field",
                }
            }

            var { data, error } = await supabase
                .from('levels')
                .insert(lv)
            if (error) {
                res.status(400).send({
                    error: 'Level is already exists. Submission cancelled'
                })
                return
            }
            var { data, error } = await supabase.from("records").upsert(req.body);
            res.status(200).send({ data: data, error: error })
            const { count } = await supabase
                .from('records')
                .select('isChecked', { count: 'exact', head: true })
                .is('isChecked', false)
            sendLog(`Total submission (all list, include not placed level): ${count} (New level!)`, process.env.DISCORD_WEBHOOK_ALT)
        }
        else res.status(400).send({ data: data, error: error })
    }
    else {
        res.status(200).send({ data: data, error: error })
        const { count } = await supabase
            .from('records')
            .select('isChecked', { count: 'exact', head: true })
            .is('isChecked', false)
        sendLog(`Total submission (all list, include not placed level): ${count}`, process.env.DISCORD_WEBHOOK_ALT)
    }
})
app.patch('/refreshList', async (req, res) => {
    const { token } = req.body
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })
            return
        }
        var { error } = await supabase.rpc('updateRank')
        var { error } = await supabase.rpc('updateList')
        if (redisEnabled) redisClient.flushAll('ASYNC', () => { })
        console.log(error)
        res.status(200).send(error)
    })
})
app.patch('/mergeAccount/:a/:b', async (req, res) => {
    const { token } = req.body
    const { a, b } = req.params
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })
            return
        }
        var { data, error } = await supabase
            .from('records')
            .update({ userid: b })
            .eq('userid', a)
        var { error } = await supabase
            .from('players')
            .delete()
            .match({ uid: a })
        await supabase.rpc('updateRank')
        console.log(error)
        res.status(200).send(error)
    })
})

app.get('/notifications/:id', async (req, res) => {
    const { id } = req.params
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('to', id)
    if (error) res.status(400).send(error)
    else res.status(200).send(data)
})

app.post('/notifications/:id', async (req, res) => {
    const { id } = req.params
    const { data, token } = req.body
    checkAdmin(token).then(async (user) => {
        if (!user.isAdmin) {
            res.status(401).send({
                'error': 'Token Invalid'
            })
            return
        }
        await sendNotification(data)
        res.status(200).send()
    })
})

app.delete('/notifications/:id', async (req, res) => {
    const { id } = req.params
    var { token } = req.body
    if (!checkUser(token, id)) {
        res.status(403).send({})
        return
    }
    var { error } = await supabase
        .from('notifications')
        .delete()
        .eq('to', id)
    if (error) res.status(400).send()
    else res.status(200).send()
})

app.listen(
    PORT,
    () => {
        console.log(`Local development server running on http://localhost:${PORT}`)
    }
)