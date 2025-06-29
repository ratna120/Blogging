const express = require("express");
const multer = require("multer");
const path = require("path");
const { checkAuth } = require("../middlewares/authentication");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = express.Router();

// Set up multer to save uploaded files in /public/uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET: Add Blog Page
router.get("/add", checkAuth, (req, res) => {
  res.render("add-blog");
});

// POST: Submit Blog
router.post("/", checkAuth, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, body } = req.body;
    const coverImageURL = req.file ? `/uploads/${req.file.filename}` : null;

    await Blog.create({
      title,
      body,
      coverImageURL,
      createdBy: req.user._id,
    });

    res.redirect("/");
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).send("Internal Server Error");
  }
});

// GET: View Single Blog
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    const comments = await Comment.find({ blogId: blog._id }).populate("createdBy");
    res.render("blog", { blog, comments });
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).send("Internal Server Error");
  }
});

// POST: Add Comment
router.post("/comment/:id", checkAuth, async (req, res) => {
  try {
    const comment = await Comment.create({
      content: req.body.content,
      blogId: req.params.id,
      createdBy: req.user._id,
    });

    res.redirect(`/blog/${req.params.id}`);
  } catch (err) {
    console.error("Error posting comment:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
