require("dotenv").config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');
const Blog = require('./models/blog');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.resolve("./view"));

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie('token')); // Set req.user if token is valid
app.use(express.static(path.resolve("./public")));

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use('/user', userRoute);
app.use('/blog', blogRoute);

// Homepage route
app.get("/", async (req, res) => {
  try {
    const allBlogs = await Blog.find({}).populate("createdBy");
    res.render("home", {
      user: req.user,
      blogs: allBlogs
    });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).render("error", { message: "Failed to load homepage" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});