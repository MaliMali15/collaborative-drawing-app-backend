import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"


const generateAccessandRefreshToken = async (userId) => {
        try {

            const user=await User.findById(userId)
            const accessToken= user.generateAccessToken()
            const refreshToken= user.generateRefreshToken()
    
            user.refreshToken=refreshToken
            await user.save({validateBeforeSave:false})
    
            return {accessToken,refreshToken}

        } catch (error) {

            throw new ApiError(500,"Some problem occurred while generating Access and Refresh tokens")

        }
    }

const options={
    httpOnly: true,
    secure: true
}


const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if ([username, email, password].some(f => !f || f.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) throw new ApiError(400, "User already exists");

    const user = await User.create({ username, email, password });

    const returnedUser = await User.findById(user._id).select("-password")

    return res.status(201).json(new ApiResponse(200, returnedUser, "User registered successfully"));
});

const userLogin=asyncHandler( async (req , res) => {
    const{username, password}=req.body

    if(!username && !password){
        throw new ApiError(400,"Missing credentials")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User doesnt exist")
    }

    const isPassCorrect=await user.matchPassword(password)

    if(!isPassCorrect){
        throw new ApiError(400,"Incorrect password")
    }

    const {accessToken,refreshToken}=await generateAccessandRefreshToken(user._id)

    const loggedInUser=await User.findOne({refreshToken}).select("-password -refreshToken")

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            user:loggedInUser,
            accessToken,
            refreshToken
        },
        "User successfully logged In"
    ))
})


const tokenRefresher=asyncHandler( async (req , res) => {
    const token=req.cookies.refreshToken || req.body.refreshToken

    if(!token){
        throw new ApiError(401,"Invalid incoming token")
    }

    const decodedToken=jwt.verify(token,process.env.REFRESH_TOKEN_SECRET_KEY)

    if(!decodedToken){
        throw new ApiError(401,"Invalid token")
    }

    const user=await User.findById(decodedToken._id)

    if(!user){
        throw new ApiError(401,"Invalid token")
    }

    if(token!==user.refreshToken){
        throw new ApiError(401,"Refresh Token expired")
    }

    const{accessToken,refreshToken}=await generateAccessandRefreshToken(user._id)

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            accessToken,
            refreshToken
        },
        "Tokens succesfully refreshed"
    ))


})

const userLogout=asyncHandler( async (req , res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(
        200
        ,{}
        ,"User logged out"
        )
    )
})

const updateAccountDetails=asyncHandler( async (req , res)=>{

    const {newUsername}=req.body
    if(!username){
        throw new ApiError(401,"Data invalid or missing")
    }

    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                username:newUsername
            }
        },
        {
            new: true
        }

    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse
        (
            200,
            {
                user
            },
            "User Updated succesfully"
        )
    )

})

const changePassword= asyncHandler( async( req , res) => {
    const {oldPassword,newPassword}= req.body
    const user=await User.findById(req.user._id)
    
    if(!oldPassword || !newPassword){
        throw new ApiError(400,"Invalid Request")
    }

    const isOldPassCorrect=await user.matchPassword(oldPassword)

    if(!isOldPassCorrect){
        throw new ApiError(400,"Incorrect password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(
        200,{},"Password changed successfully"
    ))

})

const getCurrentUser = asyncHandler(async (res, req) => {
    const user = await User.findById(req.user._id)

    return res.status(200)
        .json(new ApiResponse(
            200,
            user,
            "Current user retrieved successfully"
    ))
    
})

export {registerUser,userLogin,userLogout,tokenRefresher,getCurrentUser,changePassword,updateAccountDetails}