const express = require("express");
const session = require("express-session");
const path = require("path");
const url = require("url");
const Joi = require("joi");
const MongoStore = require("connect-mongo");
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
  res.send(`
            <h3>Login</h3>
            <form action="/login" method="POST">
                <input name="email" type="text" placeholder="email" >
                <input name="password" type="password" placeholder="password" id="password">
                <button>Login</button>
            </form>
            <script>
                function showPass() {
                    const passInput = document.getElementById("password");
                    passInput.type = passInput.type === "password" ? "text" : "password";
                    
                    const toggleBtn = document.getElementById("toggleShowPass");
                    toggleBtn.textContent = toggleBtn.textContent === "show password" 
                                                ? "hide password" : "show password";
                };
            </script>
        `);
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  const valid = schema.validate({ email });

  if (valid.error != null) {
    return res.send(`
        <p>${valid.error.details[0].message}</p>
        <form action="/login" method="GET">
                <input type="submit" value="Back to Login" />
            </form>
        `);
  }

  const foundUser = await userCollection
    .find({ email })
    .project({ email: 1, username: 1, password: 1, _id: 1 })
    .toArray();

  if (foundUser.length != 1) {
    console.log("user not found");
    return res.send(`
        <p>Invalid email/password combination</p>
        <form action="/login" method="GET">
                <input type="submit" value="Back to Login" />
            </form>
        `);
  }

  if (await bcrypt.compare(password, foundUser[0].password)) {
    console.log("correct password");
    req.session.auth = true;
    req.session.username = foundUser[0].username;
    req.session.cookie.maxAge = expireTime;

    return res.redirect("/members");
  } else {
    console.log("incorrect password");
    return res.send(`
        <p>Invalid email/password combination</p>
        <form action="/login" method="GET">
                <input type="submit" value="Back to Login" />
            </form>
        `);
  }
});

app.get("/members", (req, res) => {
  if (!req.session.auth) {
    return res.redirect("/");
  }

  return res.render("members", {
    user: req.session.username,
    imgs: ["images/eq1.jpeg", "images/eq2.png", "images/eq3.jpeg"],
  });
});

app.get("/admin", (req, res) => {
  if (!req.session.auth) {
    return res.redirect("/");
  }

  if (req.session.isAdmin !== true) {
    return res.send(`
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <form action="/" method="GET">
            <input type="submit" value="Home" />
        </form>
    `);
  }

  return res.render("admin", {
    user: req.session.username,
    imgs: ["images/eq1.jpeg", "images/eq2.png", "images/eq3.jpeg"],
  });
});

app.post("/logout", (req, res) => {
  res.clearCookie("connect.sid");
  req.session.destroy();

  res.render("logout");
});

// Note: app.use, not app.get
app.use(function (req, res) {
  res.status(404);
  res.send(`
        <h1>Page not found - 404</h1>
        <form action="/" method="GET">
            <input type="submit" value="Home" />
        </form>
    `);
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});
