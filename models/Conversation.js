const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      ],
      validate: {
        validator: (arr) => arr.length === 2 && arr[0].toString() !== arr[1].toString(),
        message: 'A conversation must have exactly 2 distinct participants',
      },
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: true }
)

// Quick lookup of conversations for a user
conversationSchema.index({ participants: 1 })
// Prevent duplicate DM pairs — sort participant IDs before saving to guarantee order
conversationSchema.index({ 'participants.0': 1, 'participants.1': 1 }, { unique: true })

// Always store participants sorted so the unique index is deterministic
conversationSchema.pre('save', function (next) {
  this.participants.sort((a, b) => a.toString().localeCompare(b.toString()))
  next()
})

module.exports =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema)
