const mongoose = require('mongoose')

const usersSchema = new mongoose.Schema({
    name: { type: String },
    id: { type: Number }
})

const model = mongoose.model('usersModel', usersSchema)
module.exports = model