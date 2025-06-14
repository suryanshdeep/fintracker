"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
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

// server action for creating accounts
export async function createAccount(data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not Found");
        }

        //Convert balance to float before saving
        const balanceFloat = parseFloat(data.balance)
        if (isNaN(balanceFloat)) {
            throw new Error("Invalid balance amount");
        }

        //check if this is the users first account
        const existingAccounts = await db.account.findMany({
            where: {
                userId: user.id
            },
        })

        const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;
        //if this account should be default unset other default accounts
        if (shouldBeDefault) {
            await db.account.updateMany({
                where: {
                    userId: user.id, isDefault: true
                },
                data: { isDefault: false },
            });
        }

        const account = await db.account.create({
            data: {
                ...data,
                balance: balanceFloat,
                userId: user.id,
                isDefault: shouldBeDefault,
            },
        });
        const serializedAccount = serializeTransaction(account);

        // if any changes occur in the entries then 
        // again revalidate the values again for /dashboard
        revalidatePath("/dashboard")

        return { succes: true, data: serializedAccount };
    }
    catch (error) {
        throw new Error(error.message);
    }
}

// server action for fetching account
export async function getUserAccount() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) {
        throw new Error("User not Found");
    }
    const accounts=await db.account.findMany({
        where:{userId:user.id},
        orderBy:{createdAt:"desc"},
        // the include option in a Prisma query adds related data from connected tables to the query result.
        //here it is counting the number of transactions in transaction table
        //linked with that particular account
        include:{
            _count:{
                select:{
                      transactions:true,
                },
            },
        },
    });
    const serializedAccount = accounts.map((account)=>(serializeTransaction(account)));
    return serializedAccount;
}

// get the DashBoard data
export async function getDashboardData() {
    const { userId } = await auth();
    if( !userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });
    if (!user) {
        throw new Error("User not Found");
    }
    // getting transaction for the user
    const transactions = await db.transaction.findMany({
        where:{
            userId:user.id,
        },
        orderBy: { createdAt: "desc" },
    })

    return transactions.map(serializeTransaction);
}