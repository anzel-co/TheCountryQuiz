const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const HttpError = require('./http-error.js')
const User = require('./model.js')

const date = new Date()

const month = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getAllUsersLeaderboards = async (req, res, next) => {
    let allUsers

    try {
        allUsers = await User.find({}, 'name image easyhs mediumhs hardhs qp questions corrects wrongs')
    } catch (err) {
        return next(new HttpError('Fetching data for users failed, try again later.', 500))
    }

    res.json({users: allUsers})
}

const getEasyHighscores = async (req, res, next) => {
    let allUsers

    try {
        allUsers = await User.find({}, 'name image easyhs ')
    } catch (err) {
        return next(new HttpError('Fetching data for users failed, try again later.', 500))
    }

    let users = allUsers.sort((a, b) => {
        if (a.easyhs < b.easyhs) return 1
        if (a.easyhs > b.easyhs) return -1
        return 0
    })

    users.slice(0, 10)

    res.json({users})
}

const searchUserProfile = async (req, res, next) => {
    const userName = req.params.uname

    let existingUser

    try {
        existingUser = await User.findOne({ name: userName }, 'name image easyhs mediumhs hardhs qp questions corrects wrongs')
    } catch (err) {
        return next(new HttpError('Fething for data failed, try again.', 500))
    }

    if(!existingUser) return next(new HttpError('No such user exists.', 422))

    res.json({ user: existingUser })
}

const register = async (req, res, next) => {
    const validationresult = validationResult(req)
    if (!validationresult.isEmpty()){
        return next(new HttpError(validationresult.errors[0].msg, 422))
    }

    const { name, email, password } = req.body

    let existingName
    let existingEmail

    try {
        existingName = await User.findOne({ name: name })
        existingEmail = await User.findOne({ email: email })
    } catch (err) {
        return next(new HttpError('Failed to register, try again later.', 500))
    }

    if (existingName || existingEmail) return next(new HttpError('User already exists, try to log in instead.', 422))

    let encryptedPassword
    try {
        encryptedPassword = await bcrypt.hash(password, 10)
    } catch (err) {
        return next(new HttpError('User cannot be created, try again.', 500))
    }
    

    const createdUser = new User({
        name,
        email,
        password: encryptedPassword,
        image: "character",
        tokens: 1000,
        images: [
            "character", "chess-king", "chess-queen",
        ],
        skip: 5,
        addlife: 3,
        addtime: 3,
        showtime: 3,
        ottdice: 3,
        ffsdice: 3,
        abort: 3,
        search: 3,
        easyhs: 0,
        mediumhs: 0,
        hardhs: 0,
        qp: 0,
        questions: 0,
        corrects: 0,
        wrongs: 0
    })
    
    try {
        await createdUser.save()
    } catch (err) {
        return next(new HttpError('Failed to register, try again later.', 500))
    }
    
    let token
    try {
        token = jwt.sign({name: createdUser.name}, process.env.JWT_KEY, {expiresIn: '12h'})
    } catch (err) {
        return next(new HttpError('Failed to register, try again later.', 500))
    }

    res.status(201).json({name: createdUser.name, token: token})
}

const login = async (req, res, next) => {
    const { email, password } = req.body

    let existingUser

    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        return next(new HttpError('Failed to log in, try again later.', 500))
    }

    if (!existingUser) return next(new HttpError('Wrong email or password, try again.', 422))

    let validPassword = false
    try {
        validPassword = await bcrypt.compare(password, existingUser.password)
    } catch (err) {
        return next(new HttpError('Could not log you in, please try again.', 500))
    }

    if (!validPassword) return next(new HttpError('Wrong email or password, try again.', 422))

    let token
    try {
        token = jwt.sign({name: existingUser.name}, process.env.JWT_KEY, {expiresIn: '12h'})
    } catch (err) {
        return next(new HttpError('Could not log you in, please try again.', 500))
    }

    res.json({name: existingUser.name, token: token})
}

const getUserProfile = async (req, res, next) => {
    const userName = req.params.uname

    let user

    try {
        user = await User.findOne({ name: userName }, '-email -password')
    } catch (err) {
        return next(new HttpError(`Fetching data for ${userName} failed, try again later.`, 500))
    }

    if (!user) return next(new HttpError('User does not exist.', 422))

    if (user.name !== req.userName.name) return next(new HttpError(`You are not authorized to get this profile.`, 401))

    res.json({user})
}

const getUserInventory = async (req, res, next) => {
    const userName = req.params.uname

    let user

    try {
        user = await User.findOne({ name: userName }, '-email -password -image -images')
    } catch (err) {
        return next(new HttpError(`Fetching data for ${userName} failed, try again later.`, 500))
    }

    if (!user) return next(new HttpError('User does not exist.', 422))

    if (user.name !== req.userName.name) return next(new HttpError(`You are not authorized to get this inventory.`, 401))

    res.json({user})
}

const saveUserProfile = async (req, res, next) => {
    const validationresult = validationResult(req)
    if (!validationresult.isEmpty()){
        return next(new HttpError(validationresult.errors[0].msg, 422))
    }

    const { newName, newImage } = req.body
    const userName = req.params.uname

    let existingName
    let user

    try {
        user = await User.findOne({ name: userName })
    } catch (err) {
        return next(new HttpError('Fetching data for user failed, try again later.', 500))
    } 

    if (!user) return next(new HttpError('User does not exist.', 422))

    if (user.name !== req.userName.name) return next(new HttpError(`You are not authorized to edit this profile.`, 401))

    try {
        existingName = await User.findOne({ name: newName })
    } catch (err) {
        return next(new HttpError('Failed to register, try again later.', 500))
    }

    if (existingName) {
        if (existingName === user.name || user.name === newName) {
            user.name = newName
            user.image = newImage
        } else {
            return next(new HttpError('Name already exists, try another one.', 422))
        }
    }

    user.name = newName
    user.image = newImage

    try {
        await user.save()
    } catch (err) {
        return next(new HttpError('Something went wrong, try again later.', 500))
    }

    let token
    try {
        token = jwt.sign({name: user.name}, process.env.JWT_KEY, {expiresIn: '12h'})
    } catch (err) {
        return next(new HttpError('Could save changes, try again.', 500))
    }

    res.status(200).json({name: user.name, token: token})
}

const useItem = async (req, res, next) => {
    const userName = req.params.uname
    const item = req.params.item

    let user

    try {
        user = await User.findOne({ name: userName })
    } catch (err) {
        return next(new HttpError('Failed to fetch data.', 500))
    }

    if (!user) return next(new HttpError('User does not exist.', 422))

    if (user.name !== req.userName.name) return next(new HttpError(`You are not authorized to use this item.`, 401))

    if (user[item] < 1) return next(new HttpError('This item cannot be used. Buy more items at the shop.', 422))

    user[item] -= 1

    try {
        await user.save()
    } catch (err) {
        return next(new HttpError('Failed to save.', 500))
    }

    res.status(200).json({message: 'Item was used.'})
}

const updateRecords = async (req, res, next) => {
    const { tokens, score, corrects, wrongs } = req.body
    const userName = req.params.uname

    let user

    try {
        user = await User.findOne({ name: userName })
    } catch (err) {
        return next(new HttpError('Failed to fetch data.', 500))
    }

    if (!user) return next(new HttpError('User does not exist.', 422))

    if (user.name !== req.userName.name) return next(new HttpError(`You are not authorized to update this record.`, 401))

    user.tokens = Math.max(0, user.tokens + tokens)
    user.qp = Math.max(0, user.qp + score)
    user.questions += 1
    user.corrects += corrects
    user.wrongs += wrongs

    try {
        await user.save()
    } catch (err) {
        return next(new HttpError('Failed to save.', 500))
    }

    res.status(200).json({message: 'Update successful.'})
}

const easyModeFinish = async (req, res, next) => {
    const { tokenReward, score } = req.body
    const userName = req.params.uname

    let user

    try {
        user = await User.findOne({ name: userName })
    } catch (err) {
        return next(new HttpError('Failed to fetch data.', 500))
    }
    
    if (!user) return next(new HttpError('User does not exist.', 422))

    if (user.name !== req.userName.name) return next(new HttpError(`You are not authorized to update this record.`, 401))

    user.tokens += tokenReward
    if (score > user.easyhs) user.easyhs = score

    try {
        await user.save()
    } catch (err) {
        return next(new HttpError('Failed to save.', 500))
    }

    res.status(200).json({message: 'Saved.'})
}

const hardModeFinish = async (req, res, next) => {
    const { tokenCompensation, score } = req.body
    const userName = req.params.uname

    let user

    try {
        user = await User.findOne({ name: userName })
    } catch (err) {
        return next(new HttpError('Failed to fetch data.', 500))
    }

    if (!user) return next(new HttpError('User does not exist.', 422))

    if (user.name !== req.userName.name) return next(new HttpError(`You are not authorized to update this record.`, 401))

    user.tokens += tokenCompensation
    if (score > user.hardhs) user.hardhs = score

    try {
        await user.save()
    } catch (err) {
        return next(new HttpError('Failed to save.', 500))
    }

    res.status(200).json({message: 'Saved.'})
}

const buyItem = async (req, res, next) => {
    const { cost } = req.body
    const userName = req.params.uname
    const item = req.params.item

    let user

    try {
        user = await User.findOne({ name: userName })
    } catch (err) {
        return next(new HttpError('Failed to fetch data.', 500))
    }

    if (!user) return next(new HttpError('User does not exist.', 422))

    if (user.name !== req.userName.name) return next(new HttpError(`You are not authorized to buy this item.`, 401))

    if (user.tokens < cost) return next(new HttpError('Not enough tokens.', 422))

    // user.items = {[item]: [item, +1], ...user.items}
    user[item] += 1
    // let [i = item, c = c + 1] = user.items[item]
    //user.items[item] = [item , +1]
    user.tokens -= cost

    try {
        await user.save()
    } catch (err) {
        return next(new HttpError('Failed to save.', 500))
    }

    res.status(200).json({message: 'Item purchase was succesful.'})
}

exports.getAllUsersLeaderboards = getAllUsersLeaderboards
exports.getEasyHighscores = getEasyHighscores
exports.getUserProfile = getUserProfile
exports.getUserInventory = getUserInventory
exports.searchUserProfile = searchUserProfile
exports.login = login
exports.register = register
exports.saveUserProfile = saveUserProfile
exports.useItem = useItem
exports.updateRecords = updateRecords
exports.easyModeFinish = easyModeFinish
exports.hardModeFinish = hardModeFinish
exports.buyItem = buyItem