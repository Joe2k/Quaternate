const  express  = require("express");
const  connectdb  = require("../config/db");
const  Chats  = require("../models/Chat");

const  router  =  express.Router();

router.route("/chat").get((req, res, next) =>  {
        res.setHeader("Content-Type", "application/json");
        res.statusCode  =  200;
        connectdb.then(db  =>  {
            Chats.find({}).then(chat  =>  {
            res.json(chat);
        });
    });
});

module.exports  =  router;