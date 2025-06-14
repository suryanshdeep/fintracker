"use server"
import { db } from "@/lib/prisma";
import { auth, getAuth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


const serializeTransaction = (obj) => {
    const serialized = { ...obj };

    if (obj.balance) {
        serialized.balance = obj.balance.toNumber();
    }

    if (obj.amount) {
        serialized.amount = obj.amount.toNumber();
    }
    return serialized;
};

//function for dealing with default account
export async function updateDefaultAccount(accountId){
   try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) {
        throw new Error("User not Found");
    }

    //unsetting accounts which is Default
    await db.account.updateMany({
        where: {
            userId: user.id, isDefault: true
        },
        data: { isDefault: false },
    });

    //setting that only clicked account with particular id isdefault true
    const account =await db.account.update({
        where:{
            id:accountId,
            userId:user.id,
        },
        data:{
            isDefault:true
        },
    });

    // if any changes occur in the entries then 
        // again revalidate the values again for /dashboard
        revalidatePath("/dashboard")

    return {success:true,data:serializeTransaction(account)};
   } catch (error) {
    return {success:false,error:error.message};
   }
}
//function to get transaction for account
export async function getAccountWithTransactions(accountId){
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) {
        throw new Error("User not Found");
    }

    const account =await db.account.findUnique({
        where:{
            id:accountId, userId:user.id,
        },
        include:{
            transactions:{
                orderBy:{
                    date:"desc",
                }
            },
            _count:{
                select:{
                    transactions:true
                },
            }
        }
    });

    if(!account) return null;
     return {
        ...serializeTransaction(account),
        transactions:account.transactions.map(serializeTransaction)
     }

}
//function for bulk delete actions
export async function bulkDeleteTransactions(transactionIds){
    try{
        const {userId}=await auth();
        if(!userId) throw new Error("Unauthorized");

        const user=await db.user.findUnique({
            where:{
                clerkUserId:userId,
            },
        });

        if(!user) throw new Error("User not found");

        const transactions=await db.transaction.findMany({
            where:{
                id:{ in:transactionIds},
                userId:user.id,
            }
        });

        const accountBalanceChanges=transactions.reduce((acc,transaction)=>{
            const change=transaction.type==="EXPENSE"
                ?+transaction.amount
                :-transaction.amount;
            //For scalabilty and all
            // will make change of the transaction in only those acc which it actually belongs
            acc[transaction.accountId]=(acc[transaction.accountId] || 0)+change;
            return acc
        },{});

        //Delete transaction and update account balances in a transaction
        // Start a Prisma transaction to ensure everything happens atomically
await db.$transaction(async (tx) => {
  
    // Step 1: Delete multiple transactions at once
    await tx.transaction.deleteMany({
      where: {
        // Only delete transactions whose IDs are in 'transactionIds' array
        id: { in: transactionIds },
        // Also make sure these transactions belong to the currently logged-in user
        userId: user.id,
      },
    });
  
    // Step 2: Update account balances for affected accounts
    // 'accountBalanceChanges' is an object where keys are account IDs, and values are the total balance change for that account
    for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
      
      // Update the 'balance' field of the account with ID 'accountId'
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            // Increment the balance by 'balanceChange'. This could be a positive or negative number.
            increment: balanceChange,
          },
        },
      });
    }
  
    // The transaction ensures that if any of the deletes or updates fail,
    // everything will be rolled back automatically to maintain data integrity
  });
  
        revalidatePath("/dashboard");
        for(const accountId of Object.keys(accountBalanceChanges)){
            revalidatePath(`/account/${accountId}`);
        }
        return {success:true};  
    }
    catch(error){
        return {
            success:false ,
            error:error.message
        };
    }
}