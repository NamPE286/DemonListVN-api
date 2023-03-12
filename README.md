# REST API

## Parameter

| Parameter      | Value                       
|:---------------|:----------------------------------
| `levelID`         | `number`
| `recordID`        | `number`
| `submissionID`    | `number`
| `userID`          | `uuid-v4`
| `list`            | `fl (VN only)` `dl (VN only)` `sea`
| `orderBy`         | `timestamp` `dlPt` `flPt` `levelid`
| `pageNumber`      | `number`

## Get a level's info and records
### Request
  `GET /level/[levelID]`

### Example
  `GET /level/57828784`

### Response

    {
      "data": {
        "id": 57828784,
        "name": "The Rupture",
        "creator": "Ka1ns",
        "videoID": "SaU454afkKY",
        "minProgress": 50,
        "flTop": null,
        "dlTop": 1,
        "flPt": null,
        "dlPt": 151.49,
        "rating": 4000,
        "ldm": [
          null
        ],
        "difficulty": "Extreme Demon",
        "description": "After opening The Rupture only few creatures survived... But for how long... Verified by Dolphy <3",
        "downloads": 107537,
        "likes": 4148,
        "length": "Long",
        "coins": 0,
        "verifiedCoins": true
      },
      "records": [
        {
          "videoLink": "https://youtu.be/Mmg5Lp13fUw",
          "refreshRate": 360,
          "progress": 100,
          "timestamp": 1653789612000,
          "flPt": null,
          "dlPt": 4000,
          "userid": "478a6d4d-8f50-4ed7-9ecd-966131ebaacd",
          "levelid": 57828784,
          "mobile": false,
          "isChecked": true,
          "comment": null,
          "players": {
            "name": "LBoke",
            "rating": 4395,
            "isHidden": false
          }
        }
      ]
    }

## Add a new level
### Request
  `POST /level/[levelID]`

### Header
    {
      "token": "",
      "data": {
        "videoID": "Gs5mRmoLh7g",
        "minProgress": 100,
        "flTop": 2,
        "dlTop": null,
        "seaTop": null,
      }
    }

## Edit a level's info
### Request
  `PUT /level/[levelID]`

### Header
    {
      "token": "",
      "data": {
        "videoID": "Gs5mRmoLh7g",
        "minProgress": 100,
        "flTop": 2,
        "dlTop": null,
        "seaTop": null,
        "prevflTop": null,
        "prevdlTop": null,
        "prevseaTop": null
      }
    }

## Delete a level
### Request
  `DELETE /level/[levelID]`

### Header
    {
      "token": ""
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
  `GET /player/[userID]`
### Example
  `GET /player/478a6d4d-8f50-4ed7-9ecd-966131ebaacd`

### Response
```json
{
    "id": 228,
    "name": "LBoke",
    "email": "lbokegd@gmail.com",
    "avatar": "Ppcat",
    "facebook": "https://www.facebook.com/poko.nguyen.90",
    "youtube": "https://www.youtube.com/channel/UCSRD9giojTqVGPLbGFiAhDQ",
    "discord": "Bokery#7128",
    "totalFLpt": 729.89,
    "totalDLpt": 63143,
    "flrank": 20,
    "dlrank": 4,
    "uid": "478a6d4d-8f50-4ed7-9ecd-966131ebaacd",
    "isAdmin": false,
    "isBanned": false,
    "isHidden": false,
    "rating": 4395,
    "dlMaxPt": 4000,
    "flMaxPt": 219,
    "overallRank": 1
}
```
    

## Get a player's records
### Request
  `GET /player/[userID]/records/[orderBy]`

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
   
## Get a player's submissions
### Request
  `GET /player/[userID]/submissions`
 
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
      ...
    ]

## Add a player
  `POST /player`
### Header
    {
      "token":"",
      "data":{
        "name": ""
      }
    }

## Edit a player's info
### Request
  `PATCH /player/[userID]`

### Header
    
    {
      "token":"",
      "data":{
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
        "uid": "3a24c91a-d45f-4e93-83f6-569858aaa35b"
      }
    }

## Add/Edit a record
### Request
  `PUT /record`
### Header
    {
      "token": "",
      "data":{
        "id": null, //Add this to perform edit operation
        "levelid": null,
        "userid": null,
        "videoLink": '',
        "refreshRate": null,
        "mobile": false,
        "progress": null,
        "timestamp": null
      }
    }

## Delete a record
### Request
  `DELETE /record/[recordID]`
### Header
    {
      "token":""
    }

## Reject/Delete a submission
### Request
  `DELETE /submission/[submissionID]`
### Header
    {
      "token": ""
    }