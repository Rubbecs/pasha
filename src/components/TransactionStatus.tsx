
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2Icon, CheckCircleIcon, AlertCircleIcon, ExternalLinkIcon } from 'lucide-react';
import { TransactionStatus } from '@/types';
import { motion } from 'framer-motion';

interface TransactionStatusProps {
  status: TransactionStatus;
}

const TransactionStatusComponent: React.FC<TransactionStatusProps> = ({ status }) => {
  if (status.status === 'idle') {
    return null;
  }

  let icon;
  let alertVariant: 'default' | 'destructive' = 'default';
  let title = '';

  switch (status.status) {
    case 'pending':
      icon = <Loader2Icon className="h-4 w-4 animate-spin text-solana" />;
      title = 'Processing Transaction';
      break;
    case 'success':
      icon = <CheckCircleIcon className="h-4 w-4 text-solana-secondary" />;
      title = 'Transaction Successful';
      break;
    case 'error':
      icon = <AlertCircleIcon className="h-4 w-4 text-destructive" />;
      title = 'Transaction Failed';
      alertVariant = 'destructive';
      break;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert variant={alertVariant} className="bg-black/20 border-solana/20">
        <div className="flex items-center">
          {icon}
          <AlertTitle className="ml-2">{title}</AlertTitle>
        </div>
        <AlertDescription className="mt-2 text-sm">
          {status.message}
        </AlertDescription>
        
        {status.txId && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs border-white/10 hover:bg-white/5"
              asChild
            >
              <a 
                href={`https://explorer.solana.com/tx/${status.txId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                View on Explorer
                <ExternalLinkIcon className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        )}
      </Alert>
    </motion.div>
  );
};

export default TransactionStatusComponent;
