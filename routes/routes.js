const { User, Message } = require('../models/models.js')
const jwt = require('jsonwebtoken')
const { Router } = require('express')
const router = Router()
process.env.SECRET_KEY = "theSecret"


router.get('/', async function (req, res){
    let messages = await Message.findAll({ include: User}) //includes User so you can access the user through the message dataValues
    let data = { messages }
    res.render('index.ejs', data)
})

router.get('/createUser', async function(req, res){
    res.render('createUser.ejs')
})

router.post('/createUser', async function(req, res){
    let { username, password } = req.body
    try {
        let user = await User.findOne({
            username
        }).then(user => {
            if(!user) { // creates user if it does not exist
                User.create({
                    username,
                    password,
                    role: "user"
                })
            } else {
                console.log('User Exists')
                res.redirect('/user-exists')
            }
        })  
    } catch (e) {
        console.log(e)
    }

    res.redirect('/login')
})

router.get('/login', function(req, res) {
    let cookies = req.cookies
    //allows only people who are not logged in onto the login page
    if(!cookies['token']){ 
        res.render('login')
    } else {
        res.redirect('/')
    }
})

// route for posting likes
router.post('/like', function(req, res){  
    let msgId = req.body.info //grabs message id from the front-end
    console.log(msgId)
    let token = req.cookies.token
    //check for json web token
    jwt.verify(token, process.env.SECRET_KEY, async function(err, decoded) {
        if(err){
            console.log(err)
            res.redirect('/')
        }
        if(decoded){
            await Message.findOne({ 
                where: {
                    id: msgId   //finds message from the data on the webpage
                }
            }).then(async function(message){
                message.update({
                    likes: message.likes + 1 //add new like
                })               
                res.redirect('/')
            })
        }
    })
})

router.post('/login', async function(req, res) {
    let {username, password} = req.body
        try {
        let user = await User.findOne({
            where: {
                username
            }
        })
        if (user && user.password === password) {
            let data = {
                username: username,
                role: user.role
            }
    
            let token = jwt.sign(data, process.env.SECRET_KEY)
            res.cookie("token", token)
            res.redirect('/')
        } else {
            res.redirect('/user-does-not-exist')
        }
    } catch (e) {
        console.log(e)
        res.redirect('/')
    }

})

router.get('/message', async function (req, res) {
    let token = req.cookies.token 

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if(err){
            res.render('login')
            console.log(err)
        }
        if(decoded){
            res.render('message')
 //           console.log(decoded)
        }
    })
    /*
    if (token) {                                      // very bad, no verify, don't do this
        console.log(token)
        res.render('message')
    } else {
        res.render('login')
    }*/
})

router.post('/message', async function(req, res){
    let { token } = req.cookies
    let { content } = req.body

    if (token) {
        let payload = await jwt.verify(token, process.env.SECRET_KEY, async function(err, decoded) {
            if(err) {
                console.log(err)
                res.redirect('/')
            }
            if(decoded){
                console.log(decoded)
                let user = await User.findOne({
                    where: {
                        username: decoded.username
                    }
                })
                let msg = await Message.create({ // creates new message
                    content,
                    UserId: user.id,
                    time: new Date(Date.now()),
                    likes: 0
                }).then(msg => {
                    console.log(msg)
                }).catch(err => {
                    console.log(err)
                    res.redirect('/login')
                })

                res.redirect('/')
            }
        })  
        res.redirect('/')
    } else {
        res.redirect('/login')
    }
})

router.get('/logout',function(req, res) { // logs out the user, forces cookie to expire
    res.cookie('token','', {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.redirect('/')
})

//shows if user exists
router.get('/user-exists', function(req, res) {
    res.render('userExists')
})

//shows if no user
router.get('/user-does-not-exist', function(req, res) {
    res.render('noUser') 
})

router.get('/error', function(req, res){
    res.render('error')
})

router.all('*', function(req, res){
    res.send('404 dude')
})

module.exports = router