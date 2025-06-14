"use client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/app/lib/schema";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import useFetch from "@/hooks/use-fetch";
import { createAccount } from "@/actions/dashboard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CreateAccountDrawer = ({ children }) => {
  const [open, setOpen] = useState(false);
  //useForm is react hook use to handle form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    //passing the schema of the form to the zod to ensure that
    //inputs in the form are filled correctly
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  //using useFetch custom hook to handle the state of page while doing api calls in backend operation
  const {
    data: newAccount,
    error,
    fn: createAccountFn,
    loading: createAccountLoading,
    setData,
  } = useFetch(createAccount);

  //for toast and drawer 
  useEffect(() => {
    if (newAccount && !createAccountLoading) {
      toast.success("Account created successfully", {
      className: 'bg-green-500 text-white',
   });
      reset(); //for resetting the entries of form
      setOpen(false); //closing the drawer after creation
    }
  }, [createAccountLoading, newAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to create Account");
    }
  }, [error]);

  // handles on submit form
  const onSubmit = async (data) => {
    // sends the data to the backend for entry in db
    await createAccountFn(data);
  };

  return (
    <div>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>This action cannot be undone.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* for name */}
              <div className="space-y-2 ">
                <label htmlFor="name" className="text-sm font-medium">
                  Account Name
                </label>
                {/* when using use form hook the input is directly connnected to the state as-
    The library manages state internally.
    register("name") binds the input to form state.
    On submit, data contains all values. */}
                <Input
                  id="name"
                  placeholder="e.g Main checking"
                  {...register("name")}
                />

                {/* for handling any input error in name */}
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              {/* for account type */}
              <div className="space-y-2 ">
                <label htmlFor="type" className="text-sm font-medium">
                  Account Type
                </label>
                {/* When integrating custom components with React Hook Form, we often use watch() and setValue() to:
    Watch field values (watch())
   Programmatically update field values (setValue()) */}
                <Select
                  onValueChange={(value) => setValue("type", value)}
                  defaultValue={watch("type")}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CURRENT">Current</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                  </SelectContent>
                </Select>
                {/* for handling any input error in account Type */}
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>
              {/* for account balance */}
              <div className="space-y-2 ">
                <label htmlFor="balance" className="text-sm font-medium">
                  Balance
                </label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("balance")}
                />
                {/* for handling any input error in balance */}
                {errors.balance && (
                  <p className="text-sm text-red-500">
                    {errors.balance.message}
                  </p>
                )}
              </div>
              {/* for default account */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <label
                    htmlFor="defaultAcc"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Set as Default
                  </label>
                  <p className="text-sm text-muted-foreground">
                    This account will be selected by default for transactions
                  </p>
                </div>
                <Switch
                  id="defaultAcc"
                  onCheckedChange={(value) => {
                    setValue("isDefault", value);
                  }}
                  defaultValue={watch("isDefault")}
                />
              </div>
              {/* buttons */}
              <div className="flex gap-4 pt-4">
                {/* button for closing the drawer */}
                <DrawerClose asChild>
                  <Button type="button" variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </DrawerClose>
                {/* submit button */}
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createAccountLoading}
                >
                  {!createAccountLoading ? (
                    "Create Account"
                  ) : (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CreateAccountDrawer;
