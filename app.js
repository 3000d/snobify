const SpotifyWebApi = require('spotify-web-api-node')
const express = require('express')
const session = require('express-session')
const path = require('path')
const dotenv = require('dotenv')
const twit = require('twig')

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

const port = 3000

const authorizeURL = spotifyApi.createAuthorizeURL(scopes);

const sess = {
  secret: process.env.SECRET_COOKIE,
  cookie: {},
  proxy: true
}

const app = express()
app.use(session(sess)) //add session
app.use("/dist", express.static(__dirname + '/client/dist')) //serve static files
app.set('views', path.join(__dirname, '/client/views')) //add twig
app.set('view engine', 'twig')
app.set('twig options', { allow_async: true })

app.get('/', (req, res) => {
  res.render('index', {
    authorizeURL
  })
})

app.get('/callback', async (req, res) => {
  if (!req.query.code) res.status(403).send("Not Allowed!")

  const token = await spotifyApi.authorizationCodeGrant(req.query.code)
  req.session.token = token.body.access_token
  await spotifyApi.setAccessToken(req.session.token)
  res.redirect('/session')

})

app.get('/session', async (req, res) => {
  if (!req.session.token) res.status(403).send("Not Allowed!")

  res.render('session', {
    data: renderList()
  })
})

app.get('/delete', async (req, res) => {
  if (!req.session.token) res.status(403).send("Not Allowed!")
  await spotifyApi.setAccessToken(req.session.token)
  const popular_track_count = await renderDeletion()
  res.render('confirm', {
    data: { popular_track_count },
  })
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
  let unpopular_track_count = 0
  let popular_track_count = 0
  for (k in keep) { unpopular_track_count += keep[k].tracks.length }
  for (r in remove) { popular_track_count += remove[r].tracks.length }
  snobiness_score = parseFloat(unpopular_track_count / (popular_track_count + unpopular_track_count) * 110).toFixed(2);
  return {
    popular_track_count,
    unpopular_track_count,
    snobiness_score
  }
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
  return removeCount
}


app.get('/test/index', (req, res) => {
  res.render('index');
});
app.get('/test/session', (req, res) => {
  res.render('session');
});
app.get('/test/confirm', (req, res) => {
  res.render('confirm');
});



app.listen(port, () => console.log(`Snobify app listening on port ${port}!`))


users.filter(user => u.PersonName === user.PersonName);
