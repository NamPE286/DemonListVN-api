const supabase = require('../db')
const getLevel = require('../etc/getLevel')
const sendLog = require('../etc/sendLog')

async function get(id){
    const d = {
        data: {},
        records: []
    }
    var { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('id', id)
    if(error) throw error
    if (!data) {
        return null
    }
    d.data = data[0]
    const lvapi = await getLevel(id)
    d.data['difficulty'] = lvapi.difficulty
    d.data['description'] = lvapi.desc
    d.data['downloads'] = lvapi.downloads
    d.data['likes'] = lvapi.likes
    if (lvapi.disliked) d.data.likes *= -1
    d.data['length'] = lvapi.length
    d.data['coins'] = lvapi.coins
    d.data['verifiedCoins'] = lvapi.verifiedCoins
    var { data, error } = await supabase
        .from('records')
        .select('*, players!inner(name, rating, isHidden)')
        .eq('levelid', id)
        .eq('players.isHidden', false)
        .eq('isChecked', true)
        .order('progress', { ascending: false })
        .order('timestamp', { ascending: true })
    d.records = data
    return d
}

async function del(id){
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
    await supabase.rpc('updateList')
    sendLog(`${user.name} (${user.uid}) deleted ${id}`)
}

async function post(id){
    var level = {
        name: null,
        creator: null,
        videoID: null,
        minProgress: null,
        flTop: null,
        dlTop: null,
    }
    var { data } = req.body
    for (const i in data) {
        if (i in level) {
            level[i] = data[i]
        }
    }
    if (level.flTop != null) level.flTop -= 0.5
    if (level.dlTop != null) level.dlTop -= 0.5
    level.id = parseInt(id)
    var { data, error } = await supabase
        .from('levels')
        .insert(level)
    if (error) throw errror
    await supabase.rpc('updateList')
    sendLog(`${user.name} (${user.uid}) added ${level.name} (${id})`)
    return level
}

async function patch(id){
    var level = {
        name: null,
        creator: null,
        videoID: null,
        minProgress: null,
        flTop: null,
        dlTop: null,
        rating: null,
        ldm: null
    }
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
    if (error) throw error
    sendLog(`${user.name} (${user.uid}) modified ${level.name} (${id})`)
    await supabase.rpc('updateList')
    return level
}

module.exports = {
    get: get,
    delete: del,
    post: post,
    patch: patch
}