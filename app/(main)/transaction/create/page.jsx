import { getUserAccount } from '@/actions/dashboard';
import { defaultCategories } from '@/data/categories';
import React from 'react'
import AddTransactionForm from '../_components/transaction-form';
import { getTransaction } from '@/actions/transactions';

const AddTransactionPage = async ({searchParams}) => {
  // In Next.js App Router, searchParams is used to access the query parameters in the URL.

  // get the user's accounts
  const accounts = await getUserAccount();

  const editId= searchParams?.edit;

  let initialData = null;
  if(editId){
    const transaction =await getTransaction(editId);
    initialData =transaction;
  }
  
  return (
    <div className='max-w-3xl mx-auto px-5'>
      <h1 className='text-5xl gradient-title mb-8 animate-gradient'>{editId ? "Edit" : "Add" } Transaction</h1>
      <AddTransactionForm
      accounts={accounts}
      categories={defaultCategories}
      initialData={initialData}
      editMode={!!editId} // true if editId exists, false otherwise
      />
    </div>
  )
}

export default AddTransactionPage;
