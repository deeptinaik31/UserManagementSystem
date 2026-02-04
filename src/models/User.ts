import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended';
  avatar?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, trim: true },
  email: { 
    type: String, 
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    index: true 
  },
  password: { type: String, select: false }, 
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user',
    index: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'suspended'], 
    default: 'active' 
  },
  avatar: String,
  lastLogin: Date,
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Fix for "OverwriteModelError" and TypeScript handling
// We check if the model exists on the connection models or mongoose.models
const User = (mongoose.models && mongoose.models.User) 
  ? (mongoose.models.User as Model<IUser>) 
  : mongoose.model<IUser>('User', UserSchema);

export default User;
