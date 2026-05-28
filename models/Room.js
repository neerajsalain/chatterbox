const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [80, 'Room name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    image: {
      type: String,
      default: '',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

roomSchema.index({ name: 'text', description: 'text' })
roomSchema.index({ members: 1 })
roomSchema.index({ isPrivate: 1, createdAt: -1 })

module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema)
