const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./model.js')

const date = new Date()

const routes = require('./routes.js')

const app = express()

app.use(bodyParser.json())

app.use(express.static(path.join('public')))

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH')
//     next()
// })

app.use('/api', routes)

app.use((req, res, next) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
})

app.use((error ,req, res, next) => {
    if (res.headerSent) {
        return next(error)
    }
    res.status(error.code || 500).json({message: error.message || 'An unknown error occured.'})
})

const reset = async () => {
    let users = await User.find({})
    users.map(user => {
        user.qp = 0
        user.questions = 0
        user.corrects = 0
        user.wrongs = 0
        user.save()
    })
}

if(date.getDate() === 1) reset()

mongoose
    .connect(`mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@thecountryquiz.4ngg8id.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority`)
    .then(() => app.listen(5000))
    .catch()