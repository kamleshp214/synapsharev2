const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const firebaseAdmin = require("firebase-admin");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  ),
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Created uploads directory");
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "video/mp4",
    "video/webm",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images, PDFs, and MP4/WebM videos are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// Schemas
const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  username: { type: String, unique: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const noteSchema = new mongoose.Schema({
  title: String,
  fileUrl: String,
  uploadedBy: String,
  subject: String,
  createdAt: { type: Date, default: Date.now },
  text: { type: String, index: "text" },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  voters: [
    {
      username: String,
      voteType: { type: String, enum: ["upvote", "downvote"] },
    },
  ],
  comments: [
    {
      content: String,
      postedBy: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const discussionSchema = new mongoose.Schema({
  title: String,
  content: String,
  fileUrl: String,
  postedBy: String,
  createdAt: { type: Date, default: Date.now },
  text: { type: String, index: "text" },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  voters: [
    {
      username: String,
      voteType: { type: String, enum: ["upvote", "downvote"] },
    },
  ],
  comments: [
    {
      content: String,
      postedBy: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const nodeSchema = new mongoose.Schema({
  title: String,
  description: String,
  codeSnippet: String,
  fileUrl: String,
  postedBy: String,
  createdAt: { type: Date, default: Date.now },
  text: { type: String, index: "text" },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  voters: [
    {
      username: String,
      voteType: { type: String, enum: ["upvote", "downvote"] },
    },
  ],
  comments: [
    {
      content: String,
      postedBy: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const savedPostSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  postType: {
    type: String,
    enum: ["note", "discussion", "node"],
    required: true,
  },
  postId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Note = mongoose.model("Note", noteSchema);
const Discussion = mongoose.model("Discussion", discussionSchema);
const Node = mongoose.model("Node", nodeSchema);
const SavedPost = mongoose.model("SavedPost", savedPostSchema);

// Middleware to verify Firebase token and fetch username
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.user = decoded;

    let user = await User.findOne({ uid: decoded.uid });
    if (!user) {
      user = new User({
        uid: decoded.uid,
        email: decoded.email,
      });
      await user.save();
      console.log(`New user created: ${decoded.email}`);
    }

    // Admin override: Force username for admin if not set
    const isAdmin = decoded.email === "porwalkamlesh5@gmail.com";
    req.isAdmin = isAdmin;
    req.username = isAdmin ? user.username || "admin" : user.username || null;

    console.log(
      `Token verified - Email: ${decoded.email}, UID: ${decoded.uid}, Username: ${req.username}, isAdmin: ${req.isAdmin}`
    );
    next();
  } catch (error) {
    console.error("Token verification error:", error.message, error.stack);
    res.status(401).json({ error: "Invalid token" });
  }
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: "Admin access required" });
  }
};

// User and Username Endpoints
app.get("/api/user/:uid", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      uid: user.uid,
      username: req.username,
      email: user.email,
      isAdmin: req.isAdmin,
    });
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post("/api/check-username", async (req, res) => {
  const { username } = req.body;
  try {
    const exists = await User.findOne({ username });
    res.json({ exists: !!exists });
  } catch (error) {
    console.error("Error checking username:", error.message);
    res.status(500).json({ error: "Failed to check username" });
  }
});

app.post("/api/save-username", verifyToken, async (req, res) => {
  const { username } = req.body;
  try {
    const existingUser = await User.findOne({ uid: req.user.uid });
    if (existingUser && existingUser.username) {
      return res.status(400).json({ error: "User already has a username" });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { username },
      { new: true }
    );
    req.username = user.username;
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error saving username:", error.message);
    res.status(500).json({ error: "Failed to save username" });
  }
});

// Notes Endpoints
app.get("/api/notes", async (req, res) => {
  try {
    const notes = await Note.find();
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error.message);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

app.post("/api/notes", verifyToken, upload.single("file"), async (req, res) => {
  try {
    console.log(
      `Attempting to post note - isAdmin: ${req.isAdmin}, username: ${req.username}, userEmail: ${req.user.email}`
    );
    if (!req.isAdmin && !req.username) {
      console.log("Username missing - returning 403");
      return res.status(403).json({ error: "Please set a username" });
    }
    console.log("Validation passed - proceeding with note creation");
    const { title, subject } = req.body;
    if (!title || !subject) {
      return res.status(400).json({ error: "Title and subject are required" });
    }
    let fileUrl = undefined;
    if (req.file) {
      console.log(
        `File uploaded: ${req.file.originalname}, size: ${req.file.size} bytes`
      );
      fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }
    const note = new Note({
      title,
      fileUrl,
      subject,
      uploadedBy: req.username,
      text: title,
    });
    await note.save();
    console.log(`Note saved: ${note._id}`);
    res.status(201).json(note);
  } catch (error) {
    console.error("Error saving note:", error.message, error.stack);
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size exceeds 50MB limit" });
    }
    if (
      error.message.includes(
        "Only images, PDFs, and MP4/WebM videos are allowed"
      )
    ) {
      return res
        .status(400)
        .json({ error: "Only images, PDFs, and MP4/WebM videos are allowed" });
    }
    res
      .status(500)
      .json({ error: "Failed to save note", details: error.message });
  }
});

app.put(
  "/api/notes/:id",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.isAdmin && !req.username) {
        return res.status(403).json({ error: "Please set a username" });
      }
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).json({ error: "Note not found" });
      if (note.uploadedBy !== req.username)
        return res.status(403).json({ error: "Not authorized" });
      note.title = req.body.title || note.title;
      note.subject = req.body.subject || note.subject;
      if (req.file) {
        if (note.fileUrl) {
          const oldFilePath = path.join(
            __dirname,
            note.fileUrl.replace("http://localhost:5000", "")
          );
          if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }
        note.fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      }
      await note.save();
      res.json(note);
    } catch (error) {
      console.error("Error updating note:", error.message);
      res.status(500).json({ error: "Failed to update note" });
    }
  }
);

app.delete("/api/notes/:id", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.uploadedBy !== req.username)
      return res.status(403).json({ error: "Not authorized" });
    if (note.fileUrl) {
      const filePath = path.join(
        __dirname,
        note.fileUrl.replace("http://localhost:5000", "")
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await note.deleteOne();
    res.json({ message: "Note deleted" });
  } catch (error) {
    console.error("Error deleting note:", error.message);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

app.post("/api/notes/:id/upvote", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    const existingVote = note.voters.find((v) => v.username === req.username);
    if (existingVote) {
      if (existingVote.voteType === "upvote") {
        note.upvotes -= 1;
        note.voters = note.voters.filter((v) => v.username !== req.username);
      } else {
        note.downvotes -= 1;
        note.upvotes += 1;
        existingVote.voteType = "upvote";
      }
    } else {
      note.upvotes += 1;
      note.voters.push({ username: req.username, voteType: "upvote" });
    }
    await note.save();
    res.json(note);
  } catch (error) {
    console.error("Error upvoting note:", error.message);
    res.status(500).json({ error: "Failed to upvote note" });
  }
});

app.post("/api/notes/:id/downvote", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    const existingVote = note.voters.find((v) => v.username === req.username);
    if (existingVote) {
      if (existingVote.voteType === "downvote") {
        note.downvotes -= 1;
        note.voters = note.voters.filter((v) => v.username !== req.username);
      } else {
        note.upvotes -= 1;
        note.downvotes += 1;
        existingVote.voteType = "downvote";
      }
    } else {
      note.downvotes += 1;
      note.voters.push({ username: req.username, voteType: "downvote" });
    }
    await note.save();
    res.json(note);
  } catch (error) {
    console.error("Error downvoting note:", error.message);
    res.status(500).json({ error: "Failed to downvote note" });
  }
});

// Discussions Endpoints
app.get("/api/discussions", async (req, res) => {
  try {
    const discussions = await Discussion.find();
    res.json(discussions);
  } catch (error) {
    console.error("Error fetching discussions:", error.message);
    res.status(500).json({ error: "Failed to fetch discussions" });
  }
});

app.post(
  "/api/discussions",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.isAdmin && !req.username) {
        return res.status(403).json({ error: "Please set a username" });
      }
      const { title, content } = req.body;
      if (!title || !content) {
        return res
          .status(400)
          .json({ error: "Title and content are required" });
      }
      let fileUrl = undefined;
      if (req.file) {
        console.log(
          `File uploaded: ${req.file.originalname}, size: ${req.file.size} bytes`
        );
        fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      }
      const discussion = new Discussion({
        title,
        content,
        fileUrl,
        postedBy: req.username,
        text: `${title} ${content}`,
      });
      await discussion.save();
      console.log(`Discussion saved: ${discussion._id}`);
      res.status(201).json(discussion);
    } catch (error) {
      console.error("Error saving discussion:", error.message, error.stack);
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size exceeds 50MB limit" });
      }
      if (
        error.message.includes(
          "Only images, PDFs, and MP4/WebM videos are allowed"
        )
      ) {
        return res.status(400).json({
          error: "Only images, PDFs, and MP4/WebM videos are allowed",
        });
      }
      res
        .status(500)
        .json({ error: "Failed to save discussion", details: error.message });
    }
  }
);

app.put(
  "/api/discussions/:id",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.isAdmin && !req.username) {
        return res.status(403).json({ error: "Please set a username" });
      }
      const discussion = await Discussion.findById(req.params.id);
      if (!discussion)
        return res.status(404).json({ error: "Discussion not found" });
      if (discussion.postedBy !== req.username)
        return res.status(403).json({ error: "Not authorized" });
      discussion.title = req.body.title || discussion.title;
      discussion.content = req.body.content || discussion.content;
      if (req.file) {
        if (discussion.fileUrl) {
          const oldFilePath = path.join(
            __dirname,
            discussion.fileUrl.replace("http://localhost:5000", "")
          );
          if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }
        discussion.fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      }
      discussion.text = `${req.body.title || discussion.title} ${
        req.body.content || discussion.content
      }`;
      if (req.body.comments) {
        discussion.comments = req.body.comments;
      }
      await discussion.save();
      res.json(discussion);
    } catch (error) {
      console.error("Error updating discussion:", error.message);
      res.status(500).json({ error: "Failed to update discussion" });
    }
  }
);

app.delete("/api/discussions/:id", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion)
      return res.status(404).json({ error: "Discussion not found" });
    if (discussion.postedBy !== req.username)
      return res.status(403).json({ error: "Not authorized" });
    if (discussion.fileUrl) {
      const filePath = path.join(
        __dirname,
        discussion.fileUrl.replace("http://localhost:5000", "")
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await discussion.deleteOne();
    res.json({ message: "Discussion deleted" });
  } catch (error) {
    console.error("Error deleting discussion:", error.message);
    res.status(500).json({ error: "Failed to delete discussion" });
  }
});

app.post("/api/discussions/:id/upvote", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion)
      return res.status(404).json({ error: "Discussion not found" });
    const existingVote = discussion.voters.find(
      (v) => v.username === req.username
    );
    if (existingVote) {
      if (existingVote.voteType === "upvote") {
        discussion.upvotes -= 1;
        discussion.voters = discussion.voters.filter(
          (v) => v.username !== req.username
        );
      } else {
        discussion.downvotes -= 1;
        discussion.upvotes += 1;
        existingVote.voteType = "upvote";
      }
    } else {
      discussion.upvotes += 1;
      discussion.voters.push({ username: req.username, voteType: "upvote" });
    }
    await discussion.save();
    res.json(discussion);
  } catch (error) {
    console.error("Error upvoting discussion:", error.message);
    res.status(500).json({ error: "Failed to upvote discussion" });
  }
});

app.post("/api/discussions/:id/downvote", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion)
      return res.status(404).json({ error: "Discussion not found" });
    const existingVote = discussion.voters.find(
      (v) => v.username === req.username
    );
    if (existingVote) {
      if (existingVote.voteType === "downvote") {
        discussion.downvotes -= 1;
        discussion.voters = discussion.voters.filter(
          (v) => v.username !== req.username
        );
      } else {
        discussion.upvotes -= 1;
        discussion.downvotes += 1;
        existingVote.voteType = "downvote";
      }
    } else {
      discussion.downvotes += 1;
      discussion.voters.push({ username: req.username, voteType: "downvote" });
    }
    await discussion.save();
    res.json(discussion);
  } catch (error) {
    console.error("Error downvoting discussion:", error.message);
    res.status(500).json({ error: "Failed to downvote discussion" });
  }
});

// Nodes Endpoints
app.get("/api/nodes", async (req, res) => {
  try {
    const nodes = await Node.find();
    res.json(nodes);
  } catch (error) {
    console.error("Error fetching nodes:", error.message);
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
});

app.post("/api/nodes", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const { title, description, codeSnippet } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }
    let fileUrl = undefined;
    if (req.file) {
      console.log(
        `File uploaded: ${req.file.originalname}, size: ${req.file.size} bytes`
      );
      fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }
    const node = new Node({
      title,
      description,
      codeSnippet,
      fileUrl,
      postedBy: req.username,
      text: `${title} ${description}`,
    });
    await node.save();
    console.log(`Node saved: ${node._id}`);
    res.status(201).json(node);
  } catch (error) {
    console.error("Error saving node:", error.message);
    res.status(500).json({ error: "Failed to save node" });
  }
});

app.put(
  "/api/nodes/:id",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.isAdmin && !req.username) {
        return res.status(403).json({ error: "Please set a username" });
      }
      const node = await Node.findById(req.params.id);
      if (!node) return res.status(404).json({ error: "Node not found" });
      if (node.postedBy !== req.username)
        return res.status(403).json({ error: "Not authorized" });
      node.title = req.body.title || node.title;
      node.description = req.body.description || node.description;
      node.codeSnippet = req.body.codeSnippet || node.codeSnippet;
      if (req.file) {
        if (node.fileUrl) {
          const oldFilePath = path.join(
            __dirname,
            node.fileUrl.replace("http://localhost:5000", "")
          );
          if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }
        node.fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      }
      node.text = `${req.body.title || node.title} ${
        req.body.description || node.description
      }`;
      if (req.body.comments) {
        node.comments = req.body.comments;
      }
      await node.save();
      res.json(node);
    } catch (error) {
      console.error("Error updating node:", error.message);
      res.status(500).json({ error: "Failed to update node" });
    }
  }
);

app.delete("/api/nodes/:id", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const node = await Node.findById(req.params.id);
    if (!node) return res.status(404).json({ error: "Node not found" });
    if (node.postedBy !== req.username)
      return res.status(403).json({ error: "Not authorized" });
    if (node.fileUrl) {
      const filePath = path.join(
        __dirname,
        node.fileUrl.replace("http://localhost:5000", "")
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await node.deleteOne();
    res.json({ message: "Node deleted" });
  } catch (error) {
    console.error("Error deleting node:", error.message);
    res.status(500).json({ error: "Failed to delete node" });
  }
});

app.post("/api/nodes/:id/upvote", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const node = await Node.findById(req.params.id);
    if (!node) return res.status(404).json({ error: "Node not found" });
    const existingVote = node.voters.find((v) => v.username === req.username);
    if (existingVote) {
      if (existingVote.voteType === "upvote") {
        node.upvotes -= 1;
        node.voters = node.voters.filter((v) => v.username !== req.username);
      } else {
        node.downvotes -= 1;
        node.upvotes += 1;
        existingVote.voteType = "upvote";
      }
    } else {
      node.upvotes += 1;
      node.voters.push({ username: req.username, voteType: "upvote" });
    }
    await node.save();
    res.json(node);
  } catch (error) {
    console.error("Error upvoting node:", error.message);
    res.status(500).json({ error: "Failed to upvote node" });
  }
});

app.post("/api/nodes/:id/downvote", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const node = await Node.findById(req.params.id);
    if (!node) return res.status(404).json({ error: "Node not found" });
    const existingVote = node.voters.find((v) => v.username === req.username);
    if (existingVote) {
      if (existingVote.voteType === "downvote") {
        node.downvotes -= 1;
        node.voters = node.voters.filter((v) => v.username !== req.username);
      } else {
        node.upvotes -= 1;
        node.downvotes += 1;
        existingVote.voteType = "downvote";
      }
    } else {
      node.downvotes += 1;
      node.voters.push({ username: req.username, voteType: "downvote" });
    }
    await node.save();
    res.json(node);
  } catch (error) {
    console.error("Error downvoting node:", error.message);
    res.status(500).json({ error: "Failed to downvote node" });
  }
});

// Admin delete endpoints
app.delete("/api/admin/notes/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.fileUrl) {
      const filePath = path.join(
        __dirname,
        note.fileUrl.replace("http://localhost:5000", "")
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await note.deleteOne();
    console.log(`Note deleted by admin: ${req.params.id}`);
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note (admin):", error.message);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

app.delete(
  "/api/admin/discussions/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const discussion = await Discussion.findById(req.params.id);
      if (!discussion)
        return res.status(404).json({ error: "Discussion not found" });
      if (discussion.fileUrl) {
        const filePath = path.join(
          __dirname,
          discussion.fileUrl.replace("http://localhost:5000", "")
        );
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await discussion.deleteOne();
      console.log(`Discussion deleted by admin: ${req.params.id}`);
      res.json({ message: "Discussion deleted successfully" });
    } catch (error) {
      console.error("Error deleting discussion (admin):", error.message);
      res.status(500).json({ error: "Failed to delete discussion" });
    }
  }
);

app.delete("/api/admin/nodes/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const node = await Node.findById(req.params.id);
    if (!node) return res.status(404).json({ error: "Node not found" });
    if (node.fileUrl) {
      const filePath = path.join(
        __dirname,
        node.fileUrl.replace("http://localhost:5000", "")
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await node.deleteOne();
    console.log(`Node deleted by admin: ${req.params.id}`);
    res.json({ message: "Node deleted successfully" });
  } catch (error) {
    console.error("Error deleting node (admin):", error.message);
    res.status(500).json({ error: "Failed to delete node" });
  }
});

// Saved Posts and Other Endpoints
app.post("/api/savedPosts", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const { postType, postId } = req.body;
    const savedPost = new SavedPost({
      userEmail: req.user.email,
      postType,
      postId,
    });
    await savedPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error saving post:", error.message);
    res.status(500).json({ error: "Failed to save post" });
  }
});

app.get("/api/savedPosts", verifyToken, async (req, res) => {
  try {
    if (!req.isAdmin && !req.username) {
      return res.status(403).json({ error: "Please set a username" });
    }
    const savedPosts = await SavedPost.find({ userEmail: req.user.email });
    res.json(savedPosts);
  } catch (error) {
    console.error("Error fetching saved posts:", error.message);
    res.status(500).json({ error: "Failed to fetch saved posts" });
  }
});

app.get("/api/news", async (req, res) => {
  try {
    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: { category: "technology", apiKey: process.env.NEWS_API_KEY },
    });
    res.json(response.data.articles);
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const { q } = req.query;
    const notes = await Note.find({ $text: { $search: q } });
    const discussions = await Discussion.find({ $text: { $search: q } });
    const nodes = await Node.find({ $text: { $search: q } });
    res.json({ notes, discussions, nodes });
  } catch (error) {
    console.error("Error searching:", error.message);
    res.status(500).json({ error: "Failed to search" });
  }
});

// Password Reset (using Firebase directly)
app.post("/api/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    await firebaseAdmin.auth().generatePasswordResetLink(email);
    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error sending password reset:", error.message);
    res.status(500).json({ error: "Failed to send password reset email" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
