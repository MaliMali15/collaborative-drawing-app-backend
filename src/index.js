import { connectDB } from "./db/db.js";
import dotenv from "dotenv"
import app from "./app.js";

dotenv.config({
    path:"./.env"
})

connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`server listening on port: ${process.env.PORT}`);
        
    })
})
    .catch((error) => {
    console.log("Mongo connection error" , error);   
})