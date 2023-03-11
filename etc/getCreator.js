const GDClient = require('geometry-dash-api');

const client = new GDClient({
    userName: 'dummy',
    password: 'dummy'
});

async function getCreator(id) {
    const user = await client.api.users.find({ query: id, page: 0 });
    return user.users[0]
}

module.exports = getCreator