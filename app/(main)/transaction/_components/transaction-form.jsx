"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { transactionSchema } from "@/app/lib/schema";
import { createTransaction, updateTransaction } from "@/actions/transactions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import { format, set, setDate } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import useFetch from "@/hooks/use-fetch";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ReceiptScanner from "./receipt-scanner";

const AddTransactionForm = ({ 
   accounts,
   categories,
   editMode = false,
   initialData = null,
    }) => {

 const router=useRouter();
 const searchParams = useSearchParams();
 const editId = searchParams.get("edit");

 const {
    register,
    handleSubmit,//compiles all the registered input together and verify whether it follow the schema or not if it follows then call the function inside it
    setValue,
    formState: { errors},
    watch,
    getValues,
    reset, // for resetting the form state after submission
 }= useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
    editMode && initialData?
    {
      type: initialData.type,
      amount: initialData.amount.toString(),
      description: initialData.description || "",
      accountId: initialData.accountId,
      category: initialData.category,
      date: new Date(initialData.date),
      isRecurring: initialData.isRecurring,
      ...initialData.recurringInterval && {
        recurringInterval: initialData.recurringInterval,
      }
    }
    :{
      type: "EXPENSE",
      amount: "",
      description: "",
      accountId: accounts.find((acc) => acc.isDefault)?.id,
      date: new Date(),
      isRecurring: false,
    },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction: createTransaction);
  
  // it watches the type field to update the form state
  const type = watch("type");
  const isRecurring=watch("isRecurring");
  const date=watch("date");

  // filter the category based on type of transaction (i.e based on expsense or income)
  const filteredCategories=categories.filter((category)=>
  // this type is (watch("type") from the form state)
  type==="EXPENSE"
  ?category.type==="EXPENSE"
  :category.type==="INCOME")

  // function to handle the form submission
//data is an object of all registered input values.which we have registered using ...register("fieldName") or setValue("fieldName", value)
  const onSubmit=async(data)=>{
    const formData = {
      ...data,
      amount: parseFloat(Number(data.amount).toFixed(2)), // ✅ rounds properly
    };
    if(editMode){
      transactionFn(editId, formData)
    }
    else{
      transactionFn(formData);
    }
  };

  // function to handle the receipt scan result
  const handleScanComplete = (scannedData) =>{
    if(scannedData){
      setValue("amount",scannedData.amount);
      setValue("date",new Date(scannedData.date));
      setValue("description", scannedData.description || "");
      if (scannedData.category) {
        const matchedCategory = filteredCategories.find(
          (cat) => cat.name.toLowerCase() === scannedData.category.toLowerCase()
        );
        if (matchedCategory) {
          setValue("category", matchedCategory.id);
          setValue("type", matchedCategory.type);
        }
      }
    }
      console.log(scannedData);
  }

  useEffect(()=>{
    if(!transactionLoading && transactionResult?.success ){
      console.log("Effect Triggered")
      toast.success(
        editMode 
        ? "Transaction updated successfully"
        :"Transaction created successfully");
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }

  },[transactionLoading, transactionResult, editMode]);

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {/* AI Receipt scanner */}
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete}
      />}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select
          onValueChange={(value) => setValue("type", value)}
          value={type}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            value={getValues("accountId")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => {
                return (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} (${parseFloat(account.balance).toFixed(2)})
                  </SelectItem>
                );
              })}
              <CreateAccountDrawer>
                <Button
                  variant="ghost"
                  className="w-full select-none items-center text-sm outline-none"
                >
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          onValueChange={(value) => setValue("category", value)}
          value={watch("category")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => {
              return (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

          {/* displaying  the select date calendar */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline"
            className="w-full pl-3 text-left font-normal">
              {" "}
              {date ? format(date, "PPP"):<span>Pick a date</span> }
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
          <Calendar
          mode="single"
          selected={date}
          onSelect={(date)=>setValue("date",date)}
          disabled={(date)=>
          date >new Date() || date < new Date("1900-01-01")}
          initialFocus
          />
          </PopoverContent>
        </Popover>

        {errors.date && (
          <p className="text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input
          type="text"
          placeholder="Enter description"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <label
                    className="text-sm font-medium cursor-pointer"
                  >
                   Recurring Transaction
                  </label>
                  <p className="text-sm text-muted-foreground">
                   Set up a recurring schedule for this transaction
                  </p>
                </div>
                <Switch
                 checked={isRecurring}
                 onCheckedChange={(value) =>setValue("isRecurring", value)}
                />
            </div>
          {isRecurring && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Recurring Frequency</label>
              <Select
                onValueChange={(value) => setValue("recurringInterval", value)}
                defaultValues={getValues("recurringInterval")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
              {errors.recurringInterval && (
                <p className="text-sm text-red-500">
                  {errors.frequency.message}</p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button
            type="button"
            variant="outline"
            className="content-fill" 
            onClick={()=>router.back()}
            >Cancel</Button>
            <Button
            type="submit"
            className="content-fill"
            disabled={transactionLoading}
            >
              {transactionLoading?
              (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              {editMode?"Updating...": "Creating..."}
              </>)
              : editMode? (
                "Update Transaction"
              ):(
                "Create Transaction"
              )}
             </Button>
          </div>
    </form>
  );
};

export default AddTransactionForm;
