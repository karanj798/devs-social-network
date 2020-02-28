const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user: {
        type: String,
        ref: 'users'
    },
    text: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    avator: {
        type: String
    },
    likes: [
        {
            user: {
                type: String,
                ref: 'users'
            }
        }
    ],
    comments: [
        {
            user: {
                type: String,
                ref: 'users'
            },
            text: {
                type: String,
                required: true
            },
            avator: {
                type: String
            },
            date: {
                type: Date,
                default: Date.now
            }

        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Post = mongoose.model('post', PostSchema);