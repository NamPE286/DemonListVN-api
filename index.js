const express = require('express')
var cors = require('cors')
const jwt = require('jsonwebtoken')
const app = express()
const fetch = require('cross-fetch')
require('dotenv').config()
const PORT = process.env.PORT || 5050
const supabase = require('@supabase/supabase-js').createClient(process.env.API_URL, process.env.API_KEY)

const invalidChar = new Set('/', '\\', '\n', '\t', '$', '?', '!', '@', '*')

async function checkAdmin(token){
    try{
        jwt.verify(token, process.env.JWT_SECRET)
        user = jwt.decode(token)
        var { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('uid', user.sub)
            .single()
        return data
    }
    catch(err){
        return false
    }
}

function checkUser(token, uid){
    try{
        jwt.verify(token, process.env.JWT_SECRET)
        user = jwt.decode(token)
        return user.sub == uid
    }
    catch(err){
        return false
    }
}

app.use(express.json())
app.use(cors())

app.get('/level/:id', async (req, res) => {
    const { id, country } = req.params
    const d = {
        data:{},
        records:[]
    }
    var { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('id', id)
    if(data.length == 0){
        res.status(400).send({
            message: 'Level does not exists'
        })
        return
    }
    d.data = data[0]
    var { data, error } = await supabase
        .from('records')
        .select('*, players(name), players(isHidden)')
        .eq('levelid', id)
        .eq('isHidden', false)
        .order('progress', {ascending: false})
        .order('timestamp', {ascending: true})
    d.records = data
    res.status(200).send(d)
})
app.get('/level/:id/:country', async (req, res) => {
    const { id, country } = req.params
    const d = {
        data:{},
        records:[]
    }
    var { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('id', id)
    if(data.length == 0){
        res.status(400).send({
            message: 'Level does not exists'
        })
        return
    }
    d.data = data[0]
    d.records = []
    var { data, error } = await supabase
        .from('records')
        .select('*, players(name, country)')
        .eq('levelid', id)
        .order('progress', {ascending: false})
        .order('timestamp', {ascending: true})
    for(const i of data){
        if(i.players.country == country) d.records.push(i)
    }
    res.status(200).send(d)
})
app.post('/level/:id', (req, res) => {
    const { id } = req.params
    const { token, data } = req.body
    checkAdmin(token).then(async (user) => {
        if(!user.isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
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
            seaTop: null
        }
        for(const i in data){
            if(i in level) {
                level[i] = data[i]
            }
        }
        if(level.flTop != null) level.flTop -= 0.5
        if(level.dlTop != null) level.dlTop -= 0.5
        if(level.seaTop != null) level.seaTop -= 0.5
        fetch(`https://gdbrowser.com/api/level/${id}`)
            .then((res) => res.json())
            .then(async (dat) => {
                if(dat == -1){
                    res.status(400).send({
                        'message': 'Level does not exist.'
                    })
                    return
                }
                level.name = dat.name
                if(!level.creator) level.creator = dat.author
                if(level.minProgress < 1) level.minProgress = 100
                level.id = parseInt(id)
                var { data, error } = await supabase
                    .from('levels')
                    .insert(level)
                if(error){
                    res.status(500).send(error)
                    return
                }
                var { data, error } = await supabase
                    .rpc('updateRank')
                if(error){
                    res.status(500).send(error)
                    return
                }
                res.status(200).send(level)
            })
    })
})
app.patch('/level/:id', (req, res) => {
    const { id } = req.params
    const { token, data } = req.body
    checkAdmin(token).then(async (user) => {
        if(!user.isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
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
            seaTop: null
        }

        if(data.dlTop == null){}
        else if(data.prevdlTop == null) data.seaTop -= 0.5
        else if(data.dlTop < data.prevdlTop) data.dlTop -= 0.5
        else if(data.dlTop > data.prevdlTop) data.dlTop += 0.5

        if(data.flTop == null){}
        else if(data.prevflTop == null) data.seaTop -= 0.5
        else if(data.flTop < data.prevflTop) data.flTop -= 0.5
        else if(data.flTop > data.prevflTop) data.flTop += 0.5

        if(data.seaTop == null){}
        else if(data.prevseaTop == null) data.seaTop -= 0.5
        else if(data.seaTop < data.prevseaTop) data.seaTop -= 0.5
        else if(data.seaTop > data.prevseaTop) data.dlTop += 0.5
        
        for(const i in data){
            if(i in level) {
                level[i] = data[i]
            }
        }
        fetch(`https://gdbrowser.com/api/level/${id}`)
            .then((res) => res.json())
            .then(async (dat) => {
                if(dat == -1){
                    res.status(400).send({
                        'message': 'Level does not exist.'
                    })
                    return
                }
                level.name = dat.name
                if(!level.creator) level.creator = dat.author
                if(level.minProgress < 1) level.minProgress = 100
                level.id = parseInt(id)
                var { data, error } = await supabase
                    .from('levels')
                    .update(level)
                    .match({id:level.id})
                if(error){
                    res.status(500).send(error)
                    return
                }
                var { data, error } = await supabase
                    .rpc('updateRank')
                if(error){
                    res.status(500).send(error)
                    return
                }
                res.status(200).send(level)
            })
    })
})
app.delete('/level/:id', (req, res) => {
    const { id } = req.params
    const { token } = req.body
    checkAdmin(token).then( async (user) => {
        if(!user.isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
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
            .match({id: id})
        if(error){
            res.status(500).send(error)
            return
        }
        var { data, error } = await supabase
            .rpc('updateRank')
        res.status(200).send({})
    })
})
app.get('/levels/:list/page/:id', async (req, res) => {
    const { id, list } = req.params
    var { data, error } = await supabase
        .from('levels')
        .select('*')
        .order(`${list}Top`, { ascending: true })
        .range((id - 1) * 200, id * 200 - 1)
        .not(`${list}Top`, 'is', null)
    if(error){
        res.status(400).send(error)
        return
    }
    res.status(200).send(data)
})
app.get('/player/:id', async (req, res) =>{
    const { id } = req.params
    var { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('uid', id)
        .single()
    if(!data){
        res.status(400).send({
            message: 'Player does not exists'
        })
        return
    }
    res.status(200).send(data)
})
app.get('/player/:id/submissions', async (req, res) => {
    const { id } = req.params
    var { data, error } = await supabase
        .from('submissions')
        .select('*, levels(name)')
        .eq('userid', id)
        .order("id", {ascending: false})
    res.status(200).send(data)
})
app.get('/player/:id/records/:order', async (req, res) => {
    const { id, order } = req.params
    var { data, error } = await supabase
        .from('records')
        .select('*, levels(name)')
        .eq('userid', id)
        .order(order, {ascending: false})
    res.status(200).send(data)
})
app.get('/players/:list/page/:id', async (req, res) => {
    const { id, list } = req.params
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order(`${list}rank`, {ascending: true})
        .range((id - 1) * 200, id * 200 - 1)
        .not(`${list}rank`, 'is', null)
    if(error){
        res.status(400).send(error)
        return
    }
    res.status(200).send(data)
})
app.patch('/player/:id', async (req, res) => {
    const { id } = req.params
    var { token, data } = req.body
    a = data
    if(!checkUser(token, id)){
        res.status(403).send({})
        return
    }
    user = jwt.decode(token)
    delete data.isAdmin
    if(data.name.length > 20){
        res.status(400).send({
            message:'Too long name (max 20 characters)'
        })
        return
    }
    for(let i = 0; i < data.name.length; i++){
        if(invalidChar.has(data.name[i])){
            res.status(400).send({
                message: 'Invalid name'
            })
            return
        }
    }
    var { data, error } = await supabase
        .from('players')
        .update(a)
        .match({ uid: user.sub })
    res.status(200).send(data)
    var { data, error } = await supabase.rpc('updateRank')
})
app.get('/search/:id', async (req, res) => {
    var { id } = req.params
    if (isNaN(id)) {
        var m = {}
        var { data, error } = await supabase
            .from('levels')
            .select('*')
            .textSearch('name', `'${id}'`, {
                type: 'websearch',
                config: 'english'
            })
        for (var i = 0; i < data.length; i++) {
            m[data[i].id] = data[i]
        }
        var { data, error } = await supabase
            .from('players')
            .select('name, uid, isHidden')
            .textSearch('name', `'${id}'`, {
                type: 'websearch',
                config: 'english'
            })
            .eq('isHidden', false)
        var players = []
        for (var i = 0; i < data.length; i++) {
            players.push({
                id: data[i].uid,
                name: data[i].name
            })
        }
        var list = []
        for(const i in m){
            list.push(m[i])
        }
        res.status(200).send([list, players])
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
    var { token, data } = req.body
    record = data
    checkAdmin(token).then( async (user) => {
        if(!user.isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
        var { data, error } = await supabase
            .from('players')
            .select('country')
            .match({uid: record.userid})
            .single()
        if(data.country != user.country){
            res.status(403).send({
                'message':'Country does not match'
            })
            return
        }
        console.log(record.id)
		var { data, error } = await supabase
			.from('records')
			.upsert(record)
        record = data
        console.log(record)
		if(error){
			res.status(500).send(error)
            console.log(error)
			return
		}
		var { data, error} = await supabase.rpc('updateRank')
        res.status(200).send(record)
    })
})
app.delete('/record/:id', async (req, res) => {
    const { id } = req.params
    const { token } = req.body
    checkAdmin(token).then( async (user) => {
        if(!user.isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
        var { data, error } = await supabase
            .from('records')
            .select('players(country)')
            .match({id: id})
            .single()
        if(data.players.country != user.country){
            res.status(403).send({
                'message':'Country does not match'
            })
            return
        }
		var { data, error } = await supabase
			.from('records')
			.delete()
            .match({id : id})
		if(error){
			res.status(500).send(error)
			return
		}
		var { data, error} = await supabase.rpc('updateRank')
        res.status(200).send({})
    })
})
app.post('/player', async (req, res) => {
    var { token, data } = req.body
    player = data
    checkAdmin(token).then( async (user) => {
        if(!user.isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
        var { data, error } = await supabase.from("players").insert(player)
        if(error){
            res.status(500).send(error)
            return
        }
        res.status(200).send({
            message: 'ok'
        })
    })
})
app.delete('/submission/:id', async (req, res) => {
    var { id } = req.params
    var { token } = req.body
    checkAdmin(token).then( async (user) => {
        if(!user.isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
        var { data, error } = await supabase
            .from('submissions')
            .select('players(country)')
            .match({id: id})
            .single()
        console.log(id, data, error)
        if(data.players.country != user.country){
            res.status(403).send({
                'message':'Country does not match'
            })
            return
        }
        var { data, error } = await supabase
            .from('submissions')
            .delete()
            .match({ id: id })
        if(error){
            res.status(500).send(error)
            return
        }
        res.status(200).send({
            message: 'ok'
        })
    })
})
app.post('/submission', async (req, res) => {
    var { token, data } = req.body
    item = data
    checkAdmin(token).then( async (user) => {
        if(!user.isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
        var { data, error } = await supabase
            .from('players')
            .select('country')
            .match({uid: item.userid})
            .single()
        if(data.country != user.country){
            res.status(403).send({
                'message':'Country does not match'
            })
            return
        }
        var { data, error } = await supabase
            .from('submissions')
            .delete()
            .match({ id: item.id })
        delete item.id
        delete item.comment
        delete item.players
        delete item.levels
        var { data, error } = await supabase
            .from('records')
            .insert(item)
        if(error){
            res.status(500).send(error)
            return
        }
        res.status(200).send({
            message: 'ok'
        })
        var { data, error } = await supabase
            .rpc('updateRank')
    })
})

app.put('/admin/mergePlayer', async (req, res) => {
    const { token, data } = req.body
    checkAdmin(token).then((user) => {
        if(!user.isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
    })
})

app.listen(
    PORT,
    () => {
        console.log(`Local development server running on http://localhost:${PORT}`)
    }
)