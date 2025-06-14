"use client";
// if any folder name is started from _(underscore) then
//next.js completely ignores that (routing etc stuff)
//thus safe for making components folder

import { ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import useFetch from "@/hooks/use-fetch";
import { updateDefaultAccount } from "@/actions/accounts";
import { useEffect } from "react";
import { toast } from "sonner";

const AccountCard = ({account}) => {
    const { name, type, balance, id, isDefault }= account;

const {
    loading:updateDefaultLoading,
    fn:updateDefaultFn,
    data:updatedAccount,
    error,
}=useFetch(updateDefaultAccount);

// function to handle the default change
const handleDefaultChange=async(event)=>{
    event.preventDefault();

    if(isDefault){
        toast.warning("You need atleast one default account");
        return;
    }
    updateDefaultFn(id)
}
//for success
useEffect(()=>{
    if(updatedAccount?.success){
        toast.success("Default account updated succesfully")
    }
},[updateDefaultLoading,updatedAccount])
//for error
useEffect(()=>{
    if(error){
        toast.error(error.message || "Failed to update Default account");
    }
},[updateDefaultLoading,updatedAccount])


  return (
    <div>
      <Card className="hover:shadow-md transition-shadow group relative">
        <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">
         {name}
        </CardTitle>
        {/* if default account then will be on */}
        <Switch
        checked={isDefault}
        onClick={handleDefaultChange}
        disabled={updateDefaultLoading}
        />
        </CardHeader>
        <CardContent>
         <div className="text-2xl font-bold">
            ${parseFloat(balance).toFixed(2)}
         </div>
         <p className="text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
         </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
        </Link>
      </Card>
    </div>
  );
};

export default AccountCard;
