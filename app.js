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
const port = process.env.PORT || 8000;

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.resolve("./view"));

// ✅ Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie('token')); // set req.user if token is valid

// ✅ Serve static files
app.use(express.static(path.resolve("./public")));

// ✅ Make user available in all views (locals.user in EJS)
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// ✅ Routes
app.use('/user', userRoute);
app.use('/blog', blogRoute);

// ✅ Homepage route
app.get("/", async (req, res) => {
  const allBlogs = await Blog.find({});
  res.render("home", {
    blogs: allBlogs
  });
});

// ✅ Start the server
app.listen(port, () => console.log(`Server is running on port ${port}`));
