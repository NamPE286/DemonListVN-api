# SEADemonList-api
Southeast Asian's Demon List REST API

# REST API

## Parameter

| Parameter      | Value                       
|:---------------|:----------------------------------
| `levelID`      | `number`
| `userID`       | `uuid-v4`
| `list`         | `fl (VN only)` `dl (VN only)` `sea`
| `orderBy`      | `timestamp` `dlPt` `flPt` `levelid`

## Get a level's info and records
### Request
  `GET /levels/[levelID]`

### Response

    {
      "data": {
        "id": 57828784,
        "name": "The Rupture",
        "creator": "Ka1ns",
        "videoID": "Mmg5Lp13fUw",
        "minProgress": 50,
        "flTop": null,
        "dlTop": 1,
        "flPt": null,
        "dlPt": 137.78
      },
      "records": [
        {
          "videoLink": "https://youtu.be/Mmg5Lp13fUw",
          "refreshRate": 360,
          "progress": 100,
          "timestamp": 1659171892741,
          "flPt": null,
          "dlPt": 137.78,
          "id": 1008,
          "userid": "478a6d4d-8f50-4ed7-9ecd-966131ebaacd",
          "levelid": 57828784,
          "mobile": false,
          "players": {
            "name": "LBoke"
          }
        },
        ...
      ]
    }

## Get a list of levels in a list
### Request
  `GET /levels/[list]/page/[pageNumber]`

### Response
    [
      {
        "id": 57828784,
        "name": "The Rupture",
        "creator": "Ka1ns",
        "videoID": "Mmg5Lp13fUw",
        "minProgress": 50,
        "flTop": null,
        "dlTop": 1,
        "flPt": null,
        "dlPt": 137.78
      },
      ...
    ]
    
## Get a player's info
### Request
  `GET /players/[userID]`

### Response
    [
      {
        "id": 10,
        "name": "Zophirux",
        "email": "vnpropvpabc@gmail.com",
        "avatar": "https://media.discordapp.net/attachments/747355506913443853/1001756936984866886/baqua_2.PNG",
        "facebook": "https://www.facebook.com/profile.php?id=100057368619265",
        "youtube": "https://www.youtube.com/c/Zophirux",
        "discord": "Zophirux#8242",
        "totalFLpt": 2647.63,
        "totalDLpt": 387.36,
        "flrank": 1,
        "dlrank": 14,
        "uid": "3a24c91a-d45f-4e93-83f6-569858aaa35b",
        "isAdmin": false
      }
    ]

## Get a player records
### Request
  `GET /players/[userID]/records/[orderBy]

### Response
    [
      {
        "videoLink": "https://youtu.be/iGJo182IWe8",
        "refreshRate": 60,
        "progress": 100,
        "timestamp": 1665223200000,
        "flPt": null,
        "dlPt": 33.61,
        "id": 10465,
        "userid": "3a24c91a-d45f-4e93-83f6-569858aaa35b",
        "levelid": 18697406,
        "mobile": false,
        "levels": {
          "name": "Retention"
        }
      },
      ...
    ]
   
## Get a player submissions
### Request
  `GET /players/[userID]/submissions`
 
### Response
    [
      {
        "videoLink": "https://youtu.be/iGJo182IWe8",
        "refreshRate": 60,
        "progress": 100,
        "timestamp": 1665223200000,
        "flPt": null,
        "dlPt": 33.61,
        "id": 10465,
        "userid": "3a24c91a-d45f-4e93-83f6-569858aaa35b",
        "levelid": 18697406,
        "mobile": false,
        "levels": {
          "name": "Retention"
        }
      },
      ...
    ]
## Get a list of players in a list
### Request
 `GET /players/[list]/page/[pageNumber]`

### Response
    [
      {
        "uid": "d3f83ab9-75e9-4f4d-aa95-85870c2e52de",
        "name": "mephiles175",
        "avatar": null,
        "email": null,
        "totalFLpt": null,
        "totalDLpt": 1575.31,
        "flrank": null,
        "dlrank": 1
      },
    ]