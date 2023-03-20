const supabase = require('../../../db')

module.exports = async (id) => {
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