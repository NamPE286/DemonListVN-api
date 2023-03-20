const supabase = require('../../../db')

module.exports = async (id, order) => {
    var { data, error } = await supabase
        .from('records')
        .select('*, levels(name)')
        .eq('userid', id)
        .eq('isChecked', true)
        .order(order, { ascending: false })
    if(!data) {
        return null;
    }
    return data;
}