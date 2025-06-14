"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { categoryColors } from "@/data/categories";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { bulkDeleteTransactions } from "@/actions/accounts";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";

const ITEMS_PER_PAGE=10;

const TransactionTable = ({ transactions }) => {
  // for making changes in the route
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const [currentPage,setCurrentPage]=useState(1);

  // is using server side action bulkDeleteTransaction
  const {
    data:deleted,
    fn: deleteFn,
    loading:deleteLoading,
    }=useFetch(bulkDeleteTransactions);

// function for filtering and sorting
  const filterAndSortedTransactions = useMemo(()=>{

    let result=[...transactions];

    //Apply search filter
    if(searchTerm){
    const searchLower=searchTerm.toLowerCase();
    result=result.filter((transaction)=>
      transaction.description?.toLowerCase().includes(searchLower)
    );
    }

    //Apply recurring Filter
    if(recurringFilter){
      result=result.filter((transaction)=>{
        if(recurringFilter==="recurring") return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }

    //Apply Type filter
    if(typeFilter){
      result=result.filter((transaction)=>transaction.type=== typeFilter)
    }

    //Apply sorting
    result.sort((a,b)=>{
      let comparision=0;

      switch (sortConfig.field){
        case "date":
         comparision=new Date(a.date) - new Date(b.date);
         break;
        case "amount":
         comparision=a.amount - b.amount;
         break;
        case "category":
         comparision=a.category.localeCompare(b.category);
         break;
        default:
         comparision = 0;
      }

      return sortConfig.direction === "asc" ? comparision : -comparision;
    });

    return result;
    // error fixed ...transactions-> transactions as ...transactions creates new array evrytime even when value doesn't change
    //...creates a new array each render, making the dependency list look like it changed, which causes warnings and unnecessary re-renders.
  },[transactions,searchTerm,typeFilter,recurringFilter,sortConfig]);

  // Pagination Calculation
    const totalPages=Math.ceil(
      filterAndSortedTransactions.length/ITEMS_PER_PAGE
    );

    const paginatedTransactions=useMemo(()=>{
      const startIndex=(currentPage-1)*ITEMS_PER_PAGE;
      return filterAndSortedTransactions.slice(
        startIndex,
        startIndex+ITEMS_PER_PAGE
        );
    },[filterAndSortedTransactions,currentPage]);

    const handlePageChange=(newPage)=>{
      setCurrentPage(newPage);
      setSelectedIds([]);//clear selections on page change
    }

  //   handling the sorting acc to field
  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field == field && current.direction === "asc" ? "desc" : "asc",
    }));
  };
  
  // for selecting the checked items
  const handleSelect = (id) => {
    // will check if it includes id or not
    // if it includes the id then filter those whose id not equal to "ID"
    // if it does not then add the selected id to it
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item != id)
        : [...current, id]
    );
  };

  //function for selecting all
  const handleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === paginatedTransactions.length
        ? []
        : paginatedTransactions.map((t) => t.id)
    );
  };
 
  //function for delete bulk
  const handleBulkDelete =async ()=>{
    if(!window.confirm(`Are you sure you want delete ${selectedIds.length} transactions`)){
      return;
    }
    deleteFn(selectedIds);
  }

  useEffect(()=>{
    if(deleted && !deleteLoading){
      toast.error("Transactions deleted successfully");
      // after deleting resetting the selected ids(as those ids are deleted)
      setSelectedIds((current)=>[])
    }
  },[deleted,deleteLoading]);

  //function for clearing filters
  const handleClearFilters=()=>{
    setRecurringFilter("");
    setSearchTerm("");
    setTypeFilter("")
    setSelectedIds([]);
    setCurrentPage(1);
  }

  return (
    <div className="space-y-4">
      {deleteLoading && (<BarLoader className="mt-4" width={"100%"} color="#9333ea"/>)}
      {/* filters */}
      <div className="space-y-4">
        <div className="relative flex-col sm:flex-row gap-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search transactions"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select value={recurringFilter} onValueChange={(value)=>{
            setRecurringFilter(value)
            setCurrentPage(1)
            }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring Only</SelectItem>
              <SelectItem value="non-recurring">Non recurring Only</SelectItem>
            </SelectContent>
          </Select>
          {selectedIds.length>0 && (
            <div className="flex items-center gap-2">
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}
              >
                <Trash className="h-4 w-4 mr-2"/>
                Delete Selected ({selectedIds.length})</Button>
            </div>
          )}

          {(searchTerm || typeFilter || recurringFilter) &&
          (<Button variant="outline" size="icon" onClick={handleClearFilters}
          title="Clear Filters"
          ><X className="h-4 w-5"/>
          </Button>)}
        </div>
      </div>
      {/* transactions table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  onCheckedChange={handleSelectAll}
                  checked={
                    selectedIds.length === paginatedTransactions.length &&
                    paginatedTransactions.length > 0
                  }
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center justify-end">
                  Date
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center justify-end">
                  Category
                  {sortConfig.field === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end">
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No Transactions Found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transactions) => (
                <TableRow key={transactions.id}>
                  {/* for check box */}
                  <TableCell>
                    <Checkbox
                      onCheckedChange={() => handleSelect(transactions.id)}
                      checked={selectedIds.includes(transactions.id)}
                    />
                  </TableCell>
                  {/* for transaction date */}
                  <TableCell>
                    {format(new Date(transactions.date), "PP")}
                  </TableCell>
                  {/* for transaction details */}
                  <TableCell>{transactions.description}</TableCell>
                  {/* for transaction category */}
                  <TableCell className="capitalize">
                    {/* mapping colors according to the category by giving */}
                    <span
                      style={{
                        background: categoryColors[transactions.category],
                      }}
                      className="px-2 py-1 rounded text-white text-sm"
                    >
                      {transactions.category}
                    </span>
                  </TableCell>
                  {/* for amount */}
                  <TableCell
                    className="text-right font-medium"
                    style={{
                      color:
                        transactions.type === "EXPENSE"
                          ? "text-red-500"
                          : "text-green-500",
                    }}
                  >
                    {transactions.type === "EXPENSE" ? "-" : "+"}$
                    {transactions.amount.toFixed(2)}
                  </TableCell>
                  {/* for recurring */}
                  <TableCell>
                    {transactions.isRecurring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="outline"
                              className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              <RefreshCcw className="h-3 w-3" />
                              {transactions.recurringInterval
                                .charAt(0)
                                .toUpperCase() +
                                transactions.recurringInterval
                                  .slice(1)
                                  .toLowerCase()}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">Next Date:</div>
                              <div>
                                {format(
                                  new Date(transactions.nextRecurringDate).toLocaleDateString('en-US'),
                                  "PP"
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                  </TableCell>
                  {/* for edit/delete */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(
                              `/transaction/create?edit=${transactions.id}`
                            );
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteFn([transactions.id])}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      {totalPages>1 &&(
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline"
          size="icon" 
          onClick={()=>handlePageChange(currentPage-1)}
          disabled={currentPage===1}
          >
            <ChevronLeft className="w-4 h-4"/>
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="outline"
          size="icon"
          disabled={currentPage===totalPages}
          onClick={()=>handlePageChange(currentPage+1)}
          >
            <ChevronRight className="w-4 h-4"/>
          </Button>
        </div>
      )}

    </div>
  );
};

export default TransactionTable;
