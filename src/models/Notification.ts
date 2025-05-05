import mongoose, { Schema, Document, models, Model, Types } from "mongoose";

export type NotificationType =
  | "new_user_pending"
  | "user_status_approved" // Example for future use
  | "user_status_rejected" // Example for future use
  | "new_report_submitted"; // Example for future use

// Interface representing a Notification document in MongoDB.
export interface INotification extends Document {
  recipientRole: "admin" | "user"; // Target role for the notification
  recipientUser?: Types.ObjectId; // Specific user ID if applicable (optional)
  type: NotificationType;
  message: string;
  link?: string; // Optional link related to the notification (e.g., to the user management page)
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema corresponding to the Notification document interface.
const NotificationSchema = new Schema<INotification>(
  {
    recipientRole: {
      type: String,
      enum: ["admin", "user", "all"],
      required: true,
      index: true, // Index for faster querying by role
    },
    recipientUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true, // Index if querying by specific user often
    },
    type: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true }, // Index for querying unread
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Prevent recompilation of the model
const Notification: Model<INotification> = models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;