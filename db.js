require('dotenv').config()

const supabase = require('@supabase/supabase-js').createClient(process.env.API_URL, process.env.API_KEY)
module.exports = supabase