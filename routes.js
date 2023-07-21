const express = require('express')
const { check } = require('express-validator')

const controller = require('./controllers.js')

const authorization = require('./authorization.js')

const router = express.Router()

router.get('/users', controller.getAllUsersLeaderboards)

router.get('/users/easyhighscores', controller.getEasyHighscores)

router.get('/users/search/:uname', controller.searchUserProfile)

router.post('/register', [
    check('name').isLength({min: 2}),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({min: 8})
], controller.register)

router.post('/login', controller.login)

router.use(authorization)

router.get('/users/profile/:uname', controller.getUserProfile)

router.get('/users/inventory/:uname', controller.getUserInventory)

router.patch('/users/save/:uname', check('newName').isLength({min: 2}), controller.saveUserProfile)

router.patch('/use/:item/:uname', controller.useItem)

router.patch('/update/records/:uname', controller.updateRecords)

router.patch('/easy/:uname', controller.easyModeFinish)

router.patch('/hard/:uname', controller.hardModeFinish)

router.patch('/buy/:item/:uname', controller.buyItem)

module.exports = router