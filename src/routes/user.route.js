import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]),
    registerUser
)

router.route('/login').post(loginUser)

router.route('/get-current-user').get(verifyJwt,getCurrentUser)

router.route('/update-account-details').post(verifyJwt,updateAccountDetails)

router.route('/update-avatar').post(
    upload.single('avatar'),
    verifyJwt,
    updateUserAvatar
)

router.route('/update-cover-image').post(
    upload.single('coverImage'),
    verifyJwt,
    updateUserCoverImage
)

//Secured Routes
router.route('/logout').post(verifyJwt,logoutUser)

router.route('/refresh-token').post(refreshAccessToken)

router.route('/change-password').post(verifyJwt,changeCurrentPassword)

export default router