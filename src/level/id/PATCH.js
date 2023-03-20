const supabase = require('../../../db')

module.exports = async (id) => {
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