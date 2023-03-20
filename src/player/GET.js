const supabase = require('../../db')

module.exports = async (id) => {
    var { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('uid', id)
        .single()
        if (!data) {
            return null
        }
    return data
}