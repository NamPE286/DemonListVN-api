const express = require('express')
var cors = require('cors')
const jwt = require('jsonwebtoken')
const app = express()
const fetch = require('cross-fetch')
require('dotenv').config()
const PORT = process.env.PORT || 5050
const supabase = require('@supabase/supabase-js').createClient(process.env.API_URL, process.env.API_KEY)

var userData;

async function checkAdmin(token){
    if(process.env.DEVELOPMENT_SERVER) return true
    try{
        jwt.verify(token, process.env.JWT_SECRET)
        user = jwt.decode(token)
        var { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('uid', user.sub)
            .single()
        userData = data
        return data.isAdmin
    }
    catch(err){
        return false
    }
}

app.use(express.json())
app.use(cors())

app.get('/level/:id', async (req, res) => {
    const { id } = req.params
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
        .select('*, players(name)')
        .eq('levelid', id)
        .order('progress', {ascending: false})
        .order('timestamp', {ascending: true})
    d.records = data
    res.status(200).send(d)
})
app.post('/level/:id', (req, res) => {
    const { id } = req.params
    const { token, data } = req.body
    checkAdmin(token).then((isAdmin) => {
        if(!isAdmin) {
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
                level.creator = dat.author
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
    checkAdmin(token).then((isAdmin) => {
        if(!isAdmin) {
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
        else if(data.dlTop < data.prevdlTop) data.dlTop -= 0.5
        else if(data.dlTop > data.prevdlTop) data.dlTop += 0.5

        if(data.flTop == null){}
        else if(data.flTop < data.prevflTop) data.flTop -= 0.5
        else if(data.flTop > data.prevflTop) data.flTop += 0.5

        if(data.seaTop == null){}
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
                level.creator = dat.author
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
    checkAdmin().then(async (isAdmin) => {
        if(!isAdmin) {
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
        res.status(200).send({
            'message': 'ok'
        })
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
            .select('name, uid')
            .textSearch('name', `'${id}'`, {
                type: 'websearch',
                config: 'english'
            })
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
        res.status(200).send(data)
    }
})
app.put('/record/:id', async (req, res) => {
    const { token, data } = req.body
    checkAdmin(token).then((isAdmin) => {
        if(!isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
    })
})
app.delete('/records/:id', async (req, res) => {
    const { token, data } = req.body
    checkAdmin(token).then((isAdmin) => {
        if(!isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
    })
})
app.put('/player/:id', async (req, res) => {
    const { token, data } = req.body
    checkAdmin(token).then((isAdmin) => {
        if(!isAdmin) {
            res.status(401).send({
                'message': 'Token Invalid'
            })
            return
        }
    })
})

app.put('/admin/mergePlayer', async (req, res) => {
    const { token, data } = req.body
    checkAdmin(token).then((isAdmin) => {
        if(!isAdmin) {
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