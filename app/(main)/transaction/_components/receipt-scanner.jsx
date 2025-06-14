"use client";
import { scanReceipt } from '@/actions/transactions';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { Camera, Loader2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react'
import { toast } from 'sonner';

const ReceiptScanner = ({onScanComplete}) => {
    const fileInputRef = useRef();
    const {
        fn:scanReceiptFn,
        loading:scanReceiptLoading,
        data:scannedData,
    }= useFetch(scanReceipt);

    const handleReceiptScan = async (file) => {
        if(file.size > 5 * 1024 * 1024) { 
            toast.error("File size exceeds 5MB limit. Please upload a smaller file.");
            return;
        }
        await scanReceiptFn(file);
    };

    useEffect(()=>{
        if(!scanReceiptLoading && scannedData){
            onScanComplete(scannedData);
            toast.success("Receipt scanned successfully!");
        }
    },[scannedData,scanReceiptLoading]);

  return (
    <div>
      <input type="file" ref={fileInputRef}
      className='hidden'
      accept='image/*'
      capture="environment"
      onChange ={(e)=>{
        const file = e.target.files?.[0];
        if(file) handleReceiptScan(file);
      }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={()=>fileInputRef.current?.click()}
        disabled={scanReceiptLoading}>
        {scanReceiptLoading ?(
        <>
        <Loader2 className="mr-2 animate-spin" />
        <span>Scanning Receipt...</span>
        </>
        ):(
        <>
        <Camera className="mr-2"/>
        <span>Scan Receipt with AI</span>
        </>
        )}
      </Button>
    </div>
  )
}

export default ReceiptScanner
