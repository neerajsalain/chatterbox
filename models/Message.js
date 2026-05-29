const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Exactly one of room/conversation must be set — enforced by pre-save hook
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    content: {
      type: String,
      default: '',
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

messageSchema.index({ room: 1, createdAt: -1 })
messageSchema.index({ conversation: 1, createdAt: -1 })
messageSchema.index({ sender: 1 })

messageSchema.pre('save', function (next) {
  const hasRoom = this.room != null
  const hasConv = this.conversation != null
  if (hasRoom === hasConv) {
    return next(new Error('Message must belong to exactly one of: room or conversation'))
  }
  next()
})

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema)
