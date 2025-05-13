const express = require("express");
const session = require("express-session");
const path = require("path");
const url = require("url");
const Joi = require("joi");
const MongoStore = require("connect-mongo");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const saltRounds = 12;

require("dotenv").config();
const PORT = process.env.PORT || 3001;
const app = express();

// Set ejs as render
app.set("view engine", "ejs");

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const { database } = require("./databaseConnection.js");
const userCollection = database.db(mongodb_database).collection("users");

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

app.use(express.urlencoded({ extended: false }));
const expireTime = 3600000;
app.use(
  session({
    secret: process.env.NODE_SESSION_SECRET,
    store: mongoStore,
    resave: true,
    saveUninitialized: false,
  })
);

app.use(express.static(path.join(__dirname, "/public")));

const navlinks = [
  { name: "Home", path: "/", id: "homeButton" },
  { name: "Members", path: "/members", id: "membersButton" },
  { name: "Admin", path: "/admin", id: "adminButton" },
];

app.use("/", (req, res, next) => {
  app.locals.navlinks = navlinks;
  app.locals.currentURL = url.parse(req.url).pathname;
  next();
});

const checkAuthorization = (req, res, next) => {
  if (!req.session.auth) {
    return res.redirect("/");
  } else if (!req.session.isAdmin) {
    res.status(403);
    console.log("403 - Forbidden");
    return res.render("invalidAdmin");
  }

  return next();
};

const checkAuth = (req, res, next) => {
  if (req.session.auth) {
    next();
  } else {
    res.status(401);
    res.redirect("/");
  }
};

app.get("/", (req, res) => {
  res.render("index", {
    auth: req.session.auth,
    username: req.session?.username,
    isAdmin: true,
  });
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/createUser", async (req, res) => {
  const name = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  const schema = Joi.object({
    name: Joi.string().alphanum().max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const valid = schema.validate({ name, password, email });
  // Use != to loosly check for null and undefined
  if (valid.error != null) {
    console.log(valid.error);
    const errorDetails = valid.error.details[0].message;

    return res.render("signupError", { errorDetails });
  }

  const hashedPass = await bcrypt.hash(password, saltRounds);
  await userCollection.insertOne({
    username: name,
    email,
    password: hashedPass,
    isAdmin: false,
  });

  req.session.auth = true;
  req.session.username = name;
  req.session.cookie.maxAge = expireTime;

  res.redirect("/members");
});

app.get("/login", (req, res) => {
  console.log("locals.currentURL: ", app.locals.currentURL);
  res.render("login");
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  const valid = schema.validate({ email });

  if (valid.error != null) {
    return res.render("invalidLogin", {
      errorDetails: valid.error.details[0].message,
    });
  }

  const foundUser = await userCollection
    .find({ email })
    .project({ email: 1, username: 1, password: 1, _id: 1, isAdmin: 1 })
    .toArray();

  if (foundUser.length != 1) {
    console.log("user not found");
    return res.render("invalidLogin", {
      errorDetails: "Incorrect password/username (no user)",
    });
  }

  if (await bcrypt.compare(password, foundUser[0].password)) {
    console.log("correct password");
    req.session.auth = true;
    req.session.username = foundUser[0].username;
    req.session.cookie.maxAge = expireTime;
    req.session.isAdmin = foundUser[0].isAdmin;

    app.locals.isAdmin = req.session.isAdmin;
    app.locals.auth = req.session.auth;

    return res.redirect("/members");
  } else {
    console.log("incorrect password");
    return res.render("invalidLogin", {
      errorDetails: "Incorrect password/username",
    });
  }
});

app.get("/members", checkAuth, (req, res) => {
  console.log("locals.auth: ", app.locals.auth);
  // if (!req.session.auth) {
  //   return res.redirect("/");
  // }

  return res.render("members", {
    user: req.session.username,
    imgs: ["images/eq1.jpeg", "images/eq2.png", "images/eq3.jpeg"],
  });
});

app.get("/admin", checkAuthorization, async (req, res) => {
  // // Protect against unauthenticated users
  // if (!req.session.auth) {
  //   return res.redirect("/login");
  // }

  // console.log("isAdmin: ", req.session.isAdmin);

  // // Protect against non-admin users
  // if (req.session.isAdmin !== true) {
  //   res.status(403);
  //   console.log("403 - Forbidden");
  //   return res.render("invalidAdmin");
  // }

  try {
    // Get all users from the database
    const allUsers = await userCollection
      .find({})
      .project({ username: 1, email: 1, isAdmin: 1, _id: 1 })
      .toArray();

    // Render the admin page with the list of users
    res.render("admin", {
      users: allUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500);
    res.render("error", { errorMessage: err.message });
  }
});

app.post("/promoteUser", checkAuthorization, async (req, res) => {
  const userId = req.body.userId;
  const id = new ObjectId(userId);

  try {
    await userCollection.updateOne(
      { _id: id },
      {
        $set: {
          isAdmin: true,
        },
      }
    );

    res.redirect("/admin");
  } catch (err) {
    console.error(err);
    res.status(500);
    res.render("error", { errorMessage: err.message });
  }
});

app.post("/demoteUser", checkAuthorization, async (req, res) => {
  const userId = req.body.userId;
  const id = new ObjectId(userId);

  try {
    await userCollection.updateOne(
      { _id: id },
      {
        $set: {
          isAdmin: false,
        },
      }
    );

    res.redirect("/admin");
  } catch (err) {
    console.error(err);
    res.status(500);
    res.render("error", { errorMessage: err.message });
  }
});

app.get("/logout", (req, res) => {
  return res.render("logout");
});

app.post("/logout", (req, res) => {
  res.clearCookie("connect.sid");
  req.session.destroy();
  app.locals.auth = false;
  app.locals.isAdmin = false;
  console.log("Session destroyed");

  return res.redirect("/logout");
});

// Note: app.use, not app.get
app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});
