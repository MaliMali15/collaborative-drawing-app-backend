import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const jwtVerify = asyncHandler(async (req, res, next) => {
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(400,"Unauthorized request")
        }
    
        const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET_KEY)
    
        if(!decodedToken){
            throw new ApiError(400,"Invalid Token")
        }
    
        const user= await User.findById(decodedToken._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(400,"Invalid token")
        }
    
        req.user=user
        next()
    } catch (error) {
        throw new ApiError(400,"Invalid access token")
    }
})

export {jwtVerify}