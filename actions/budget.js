"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


export async function getCurrentBudget(accountId){
    try{
        const {userId} =await auth();
        if(!userId) throw new Error("Unauthorized");

        const user =await db.user.findUnique({
            where:{clerkUserId:userId},
        });

        if(!user){
            throw new Error("User not Found");
        }

        //getting the budget of that account
        const budget=await db.budget.findFirst({
            where:{
                userId:user.id,
            },
        });

        const currentDate=new Date();
        // basically getting the start of the current month
        const startOfMonth=new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        );
        const endOfTheMonth=new Date(
            currentDate.getFullYear(),
            currentDate.getMonth()+1,
            0
        );

        //getting the sum of expenses of the current month of the account:accountId
        //and between gte:start date of current month
        //lte :end date of current month
        const expenses =await db.transaction.aggregate({
            where:{
                userId:user.id,
                type:"EXPENSE",
                date:{
                    gte:startOfMonth,
                    lte:endOfTheMonth,
                },
                accountId:accountId,
            },
            _sum:{
                amount:true,
            }
        }); 
        
        //returning the monthly budget and expenses of that month
        return {
            budget:budget?{...budget,amount:budget.amount.toNumber()}:null,
            currentExpenses:expenses._sum.amount
            ? expenses._sum.amount.toNumber()
            :0,
        };

    }catch(error){
        console.error("Error fetching budget:",error);
        throw error;
    }
}
export async function updateBudget(amount){
    try{
        const {userId}=await auth();
        if(!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique(
            {
             where:{
                clerkUserId:userId,
             }
            }
        ) 
        if(!user) throw new Error("User Not found");

        // if we have not have the budget then it will make else it wil edit the existing one
        const budget=await db.budget.upsert({
            where:{
                userId:user.id,
            },
            update:{
                amount,
            },
            create:{
                userId:user.id,
                amount,
            }
        });

        revalidatePath("/dashboard");

        return {
            success:true,
            data:{...budget,amount:budget.amount.toNumber()},
        };
    }catch(error){
        console.error("Error updating the Budget:",error);
        return {success:false,error:error.message};
    }
}
