require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect(
      "mongodb+srv://admin:" +
        "admin" +
        "@clusterquaternate.jjj6i.mongodb.net/quaternateDB?retryWrites=true&w=majority",
      { useNewUrlParser: true, useUnifiedTopology: true }
    )
    .then(() => {
      console.log("mongodb is connected");
    })
    .catch((error) => {
      console.log("mondb not connected");
      console.log(error);
    });

  mongoose.set("useNewUrlParser", true);
  mongoose.set("useFindAndModify", false);
  mongoose.set("useCreateIndex", true);
};

module.exports = connectDB;
