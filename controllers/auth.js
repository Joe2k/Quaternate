const User = require("../models/User");
const passport = require("passport");

exports.getLogin = function (req, res, next) {
  res.render("login");
};

exports.postLogin = function (req, res, next) {
  try {
    const user = new User({
      username: req.body.email,
      password: req.body.password,
    });

    passport.authenticate("local", function (err, user, info) {
      if (err) {
        return next(err);
      } else {
        if (!user) {
          res.redirect("/auth/login");
          console.log(info);
        } else {
          req.login(user, function (err) {
            if (err) {
              console.log(err);
              res.redirect("/auth/login");
            } else {
              res.redirect("/home");
            }
          });
        }
      }
    })(req, res);
  } catch (err) {
    return next(err);
  }
};

exports.getRegister = function (req, res, next) {
  res.render("register");
};

exports.postRegister = function (req, res, next) {
  try {
    Users = new User({ username: req.body.username });
    User.register(Users, req.body.password, function (err, user) {
      if (err) {
        res.redirect("/auth/register");
        console.log(err);
      }

      User.findOneAndUpdate(
        { username: req.body.username },
        { name: req.body.name },
        function (err, doc) {
          if (err) console.log(err);
        }
      );
      passport.authenticate("local")(req, res, async function () {
        // sgMail
        //     .send(msg)
        //     .then(() => {}, error => {
        //         console.error(error);
        //
        //         if (error.response) {
        //             console.error(error.response.body)
        //         }
        //     });
        // res.redirect("/home");
      });

      res.redirect("/home");
    });
  } catch (err) {
    return next(err);
  }
};
