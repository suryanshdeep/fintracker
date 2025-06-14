import {z} from 'zod'

//form schema to validate the input for account creation
export const accountSchema=z.object({
    name:z.string().min(1,"Name is Required"),
    type:z.enum(["CURRENT","SAVINGS"]),
    balance:z.string().min(1,"Initial balance is required"),
    isDefault:z.boolean().default(false),
    
})

// form schema to validate the input for the transaction creation
export const transactionSchema = z.object({
   type:z.enum(["EXPENSE","INCOME"]),
   amount:z.string().min(1,"Amount is required"),
   description:z.string().optional(),
   date:z.date({required_error:"Date is required"}).default(()=>new Date()),
   accountId:z.string().min(1,"Account is required"),
   category:z.string().min(1,"Category is required"),
   isRecurring:z.boolean().default(false),
   recurringInterval:z.enum(["DAILY","WEEKLY","MONTHLY","YEARLY"])
   .optional(),
}) .superRefine((data,ctx)=>{
    if(data.isRecurring && !data.recurringInterval){
        ctx.addIssue({
            code:z.ZodIssueCode.custom,
            message:"Recurrign interval is required for recurring transactions",
            path:["recurringInterval"],
        })
    }
})