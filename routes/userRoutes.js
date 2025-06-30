const express = require("express");
const userController = require("./userControllers")
const userRouter = express.Router();

userRouter.post('/user/addnewUser',userController.addUser);
userRouter.get('/user/fetchUser/:refId',userController.getUserByRefId);
userRouter.post('/blockpass-webhook',userController.blockpasswebhook);

module.exports = userRouter;