const express = require('express')
const cookieParser = require('cookie-parser')
const routes = require('./routes/routes.js')
const app = express()

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(cookieParser())
app.use(express.urlencoded({extended:false}))

app.use(routes)

app.listen(9090, () => {
  console.log('App is running on localhost:9090')
})