import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import {registerUser,userLogin,userLogout,tokenRefresher,getCurrentUser,changePassword,updateAccountDetails} from "../controllers/user.controller.js"


const router = Router()

router.route("/login").post(userLogin)
router.route("/logout").post(jwtVerify,userLogout)
router.route("/register").post(registerUser)
router.route("/refreshTokens").post(tokenRefresher)
router.route("/current-user").get(jwtVerify, getCurrentUser)
router.route("/change-password").post(jwtVerify, changePassword)
router.route("/updateUserInfo").patch(jwtVerify,updateAccountDetails)

export default router