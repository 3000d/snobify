const SpotifyWebApi = require('spotify-web-api-node')
const express = require('express')
const session = require('express-session')
const path = require('path')
const dotenv = require('dotenv')
dotenv.config()

const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-modify-private', 'playlist-modify-public'],
  redirectUri = process.env.REDIRECT_URL,
  clientId = process.env.CLIENT_ID,
  clientSecret = process.env.CLIENT_SECRET

const spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId,
  clientSecret
})

const authorizeURL = spotifyApi.createAuthorizeURL(scopes);

const sess = {
  secret: process.env.SECRET_COOKIE,
  cookie: {},
  proxy: true
}

const app = express()
app.use(session(sess))
app.use("/dist", express.static(__dirname + '/client/dist'))
const port = 3000

app.get('/', (req, res) => res.sendFile(path.join(__dirname + "/client/index.html")))

app.get('/callback', async (req, res) => {
  if (!req.query.code) res.status(403).send("Not Allowed!")

  const token = await spotifyApi.authorizationCodeGrant(req.query.code)
  req.session.token = token.body.access_token
  await spotifyApi.setAccessToken(req.session.token)
  const html = await renderList()
  res.send(html)
})

app.get('/delete', async (req, res) => {
  if (!req.session.token) res.status(403).send("Not Allowed!")
  await spotifyApi.setAccessToken(req.session.token)
  const html = await renderDeletion()
  res.send(html)
})

const listTrack = async () =>
{
  const playlists = await spotifyApi.getUserPlaylists()
  let remove = []
  let keep = []

  for (p in playlists.body.items) {
    try{
      const playlist = await spotifyApi.getPlaylist(playlists.body.items[p].id)
      const tracks = playlist.body.tracks.items
      remove.push(
        {
          playlist: playlists.body.items[p].id,
          tracks: tracks.filter(t => t.track.popularity > 0).map(t => ({ name: t.track.name, uri: t.track.uri, pop: t.track.popularity }))
        }
      )
      keep.push(
        {
          playlist: playlists.body.items[p].id,
          tracks: tracks.filter(t => t.track.popularity < 1).map(t => ({ name: t.track.name, uri: t.track.uri, pop: t.track.popularity }))
        }
      )
    }
    catch(err){
      console.log(err)
    }
  }

  return {keep, remove}
}

const renderList = async (req) => {
  const { keep, remove } = await listTrack()
  let countKeep = 0
  let countRemove = 0
  for (k in keep) { countKeep += keep[k].tracks.length }
  for (r in remove ) { countRemove += remove[r].tracks.length }
  return `<html><body><BR/>REMOVE : ${countRemove}<BR />KEEP : ${countKeep}<BR /><a href="delete">delete</a></body></html>`
}

const renderDeletion = async () => {
  const { remove } = await listTrack()
  let removeCount = 0
  for( r in remove ) {
    if ( remove[r].tracks.length ) {
      removeCount++
      try {
        await spotifyApi.removeTracksFromPlaylist(remove[r].playlist, remove[r].tracks.map(t => ({ uri: t.uri })))
      }
      catch(err)
      {
        console.log(err)
      }
    }
  }
  return `<html><body><BR/>REMOVED : ${removeCount} tracks</body></html>`
}

app.listen(port, () => console.log(`Snobify app listening on port ${port}!`))