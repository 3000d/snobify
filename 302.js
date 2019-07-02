const express = require('express')

const port = 3000

const app = express()

app.get('/', (req, res) => {
  res.redirect(302, 'http://snobbify.me')
})

app.listen(port, () => console.log(`Redirecting to snobbify with 2b on port ${port}!`))
