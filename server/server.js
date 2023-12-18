const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UserModel = require("./Model/UserSchema");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const AdminModel = require("./Model/adminSchema");
const multer = require("multer");
const path = require("path");
const ComplaintModel = require("./Model/UserComplaintSchema");
const users = require("./Model/UserSchema.js");

const app = express();

app.use(
  cors({
    //JWT
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST","PUT"],
    // credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
mongoose.connect("mongodb://127.0.0.1:27017/panchayath");

//registration of user//
app.post("/signup", (req, res) => {
  const { username, email, phonenumber, password } = req.body;
  //hash password//
  bcrypt.hash(password, 10).then((hash) => {
    UserModel.findOne({ email: email })
      .then((user) => {
        if (user) {
          res.json("already have an account");
        } else {
          UserModel.create({
            username: username,
            email: email,
            phonenumber: phonenumber,
            password: hash,
          })
            .then((res) => express.response.json("Account created"))
            .catch((err) => res.json(err));
        }
      })
      .catch((err) => res.json(err));
  });
});

//login user
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({ email: email })
    .then((user) => {
      if (user) {
        bcrypt.compare(password, user.password, (err, response) => {
          if (err) {
            res.json("The password is incorrect");
          }
          if (response) {
            //jwt token//
            const maximumtime = 3 * 24 * 60 * 60;
            const token = jwt.sign({ email: user.email }, "jwt-secret-key", {
              expiresIn: maximumtime,
            });
            res.cookie("token", token);
            res.json("Success");
          } else {
            res.json("The password is incorrect");
          }
        });
      } else {
        res.json("No record existed");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json("Internal Server Error");
    });
});

//middleware to verify token//
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json("The token was not available");
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) return res.json("Token is wrong");
      next();
    });
  }
};
//jwt middleware//
app.get("/home", verifyUser, (req, res) => {
  return res.json("Success");
});

//block a user//
app.put("/blockUser/:userId", async (req, res) => {
  console.log(11);
  const { userId } = req.params;

  try {
    const user = await users.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.blocked = true;
    await user.save();

    res.json({ message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//adminlogin//
app.post("/adminlogin", (req, res) => {
  const { email, password } = req.body;
  AdminModel.findOne({ email: email })
    .then((admin) => {
      if (admin) {
        bcrypt.compare(password, admin.password, (err, response) => {
          if (err) {
            res
              .status(500)
              .json("Internal Server Error during password comparison");
          } else if (response) {
            // jwt token//
            const maxtime = 3 * 24 * 60 * 60;
            const token = jwt.sign({ email: admin.email }, "admin-key", {
              expiresIn: maxtime,
            });
            res.cookie("token", token);
            res.json("Success");
          } else {
            res.json("The password is incorrect");
          }
        });
      } else {
        res.json("No record existed for the given admin email");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json("Internal Server Error");
    });
});

//admin verify token//
const verifyAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json("The token was not available");
  } else {
    jwt.verify(token, "admin-key", (err, decoded) => {
      if (err) return res.json("Token is wrong");
      next();
    });
  }
};

//jwt middleware//
// app.get("/admin/adminhome", verifyAdmin, (req, res) => {
//   return res.json("Success");
// });

//GET DATA FROM DB TO ADMINHOME//
app.get("/", (req, res) => {
  UserModel.find({})
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
});

//complaint data pass to db//
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/complaintregister", upload.single("image"), async (req, res) => {
  try {
    const aadhar = req.body.aadhar;
    const complaint = req.body.complaint;
    const name = req.body.name;
    const email = req.body.email;
    const phonenumber = req.body.phonenumber;
    const image = req.file ? req.file.buffer.toString("base64") : null;

    // Create a new Complaint document using the Mongoose model
    const newComplaint = new ComplaintModel({
      aadhar,
      complaint,
      name,
      email,
      phonenumber,
      image,
    });

    // Save the new Complaint document to the database
    await newComplaint.save();

    console.log("Form data saved to MongoDB:", {
      aadhar,
      complaint,
      name,
      email,
      phonenumber,
    });

    res.json({ message: "Form data received and saved successfully!" });
  } catch (error) {
    console.error("Error saving form data to MongoDB:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.listen(3002, () => {
  console.log("server running successfully");
});
