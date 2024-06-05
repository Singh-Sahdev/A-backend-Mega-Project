import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY , 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:'auto'
        })
        // console.log('File successfully uploaded on cloudinary'); 
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async(public_id,resource_type) => {
    try{
        const deleted = await cloudinary.uploader.destroy(public_id,{
            resource_type
        })
        return deleted?deleted:null
    }
    catch(e){
        return null
    }
}

export {uploadOnCloudinary,deleteFromCloudinary}