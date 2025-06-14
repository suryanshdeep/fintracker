import  {currentUser}  from "@clerk/nextjs/server"
import { db } from "./prisma";


//  WILL CALL THIS FUNCTION AT THE START OF THE HEADER
export const checkUser =async()=>{
    //getting info of the current user loggedIn
    const user =await currentUser();

    // it not got the info about the user return null
    if(!user){
        return null;
    }
    try{
        // check for the user in the db if exist or not by using clerk user id
        const loggedInUser =await db.user.findUnique({
            where:{
                clerkUserId:user.id,
            },
        });
        // if exist return loggedInUser
        if (loggedInUser) {
            return loggedInUser;
        }
        //if not create user in db using info given to the clerk
        const name =`${user.firstName} ${user.lastName}`;
        //creating new user in db using info in the clerk
        const newUser= await db.user.create({
            data:{
                clerkUserId:user.id,
                name,
                imageUrl:user.imageUrl,
                email:user.emailAddresses[0].emailAddress,
            },
        });

        return newUser;
    }catch(error){
        console.log(error.message)
    }

};
