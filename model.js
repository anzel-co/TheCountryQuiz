const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const Schema = mongoose.Schema

const userSchema = new Schema({
    name: { type: String, required: true, unique: true, minlength: 2 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
    image: { type: String },
    tokens: { type: Number },
    images: { type: Array },
    skip: { type: Number },
    addlife: { type: Number },
    addtime: { type: Number },
    showtime: { type: Number },
    ottdice: { type: Number },
    ffsdice: { type: Number },
    abort: { type: Number },
    search: { type: Number },
    multiply: { type: Number },    
    easyhs: { type: Number },
    mediumhs: { type: Number },
    hardhs: { type: Number },
    qp: { type: Number },
    questions: { type: Number },
    corrects: { type: Number },
    wrongs: { type: Number }
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)