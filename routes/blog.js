const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const { checkAuth } = require("../middlewares/authentication");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = express.Router();

// Multer storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET: Show Add Blog Page
router.get("/add", checkAuth, (req, res) => {
  console.log("Accessing /blog/add, user:", req.user);
  res.render("add-blog", { user: req.user });
});

// POST: Handle Blog Submission
router.post("/", checkAuth, upload.single("coverImage"), async (req, res) => {
  try {
    console.log("POST /blog received:", { body: req.body, file: req.file, user: req.user });
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).render("error", { message: "Title and body are required" });
    }
    if (!req.user || !req.user._id) {
      return res.status(401).render("error", { message: "User not authenticated" });
    }
    const coverImageURL = req.file ? `/uploads/${req.file.filename}` : null;

    const blog = await Blog.create({
      title,
      body,
      coverImageURL,
      createdBy: req.user._id,
    });
    console.log("Blog created:", blog);

    res.redirect("/");
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).render("error", { message: `Failed to create blog: ${err.message}` });
  }
});

// GET: View Single Blog
router.get("/:id", async (req, res) => {
  try {
    console.log("GET /blog/:id, id:", req.params.id);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).render("error", { message: "Invalid blog ID" });
    }
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    if (!blog) {
      return res.status(404).render("error", { message: "Blog not found" });
    }
    const comments = await Comment.find({ blogId: blog._id }).populate("createdBy");

    res.render("blog", { blog, comments, user: req.user });
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).render("error", { message: `Failed to fetch blog: ${err.message}` });
  }
});

// POST: Add Comment to Blog
router.post("/comment/:id", checkAuth, async (req, res) => {
  try {
    console.log("POST /blog/comment/:id, id:", req.params.id);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).render("error", { message: "Invalid blog ID" });
    }
    const { content } = req.body;
    if (!content) {
      return res.status(400).render("error", { message: "Comment content is required" });
    }

    await Comment.create({
      content,
      blogId: req.params.id,
      createdBy: req.user._id,
    });

    res.redirect(`/blog/${req.params.id}`);
  } catch (err) {
    console.error("Error posting comment:", err);
    res.status(500).render("error", { message: `Failed to post comment: ${err.message}` });
  }
});

module.exports = router;