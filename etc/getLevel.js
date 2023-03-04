async function getLevel(id) {
    var level = {
        levelID: null,
        name: null,
        desc: null,
        version: null,
        creatorUserID: null,
        diff: null,
        downloads: null,
        likes: null,
        track: null,
        gameVersion: null,
        demonDiff: null,
        stars: null,
        isFeatured: null,
        isEpic: null,
        length: null,
        original: null,
        songID: null,
        coins: null,
        requestedStars: null,
        isLDM: null,
        password: null
    }
    try {
        level = await client.api.levels.getById({ levelID: parseInt(id) })
    }
    catch {
        return level
    }
    level.desc = Buffer.from(level.desc, 'base64').toString()
    level['difficulty'] = level.diff
    if (level.stars == 10) {
        if (level.diff == 'Easy') level.difficulty = 'Easy Demon'
        else if (level.diff == 'Normal') level.difficulty = 'Medium Demon'
        else if (level.diff == 'Hard') level.difficulty = 'Hard Demon'
        else if (level.diff == 'Harder') level.difficulty = 'Insane Demon'
        else level.difficulty = 'Extreme Demon'
    }
    level.verifiedCoins = true
    level.length = level.length[0].toUpperCase() + level.length.slice(1).toLowerCase()
    if (level.length == 'Xl') level.length = 'XL'
    return level
}

module.exports = getLevel