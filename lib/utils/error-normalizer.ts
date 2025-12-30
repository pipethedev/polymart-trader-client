interface NormalizedError {
  message: string;
  title?: string;
  details?: string;
  action?: string;
}


export function normalizeError(error: unknown): NormalizedError {
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    
    if (errorObj.response && typeof errorObj.response === 'object') {
      const response = errorObj.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as Record<string, unknown>;
        
        if (responseData.message && typeof responseData.message === 'string') {
          const normalized = normalizeErrorMessage(responseData.message);
          return {
            ...normalized,
            title: normalized.title || (responseData.code && typeof responseData.code === 'string' 
              ? responseData.code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              : undefined),
            details: normalized.details || (responseData.details 
              ? typeof responseData.details === 'string' 
                ? responseData.details 
                : JSON.stringify(responseData.details, null, 2)
              : undefined),
          };
        }
      }
    }
    
    if (errorObj.error && typeof errorObj.error === 'object') {
      const nestedError = errorObj.error as Record<string, unknown>;
      if (nestedError.message) {
        return normalizeErrorMessage(String(nestedError.message), error);
      }
    }

    if (errorObj.message) {
      return normalizeErrorMessage(String(errorObj.message), error);
    }

    if (errorObj.reason) {
      return normalizeErrorMessage(String(errorObj.reason), error);
    }

    return {
      message: 'An unexpected error occurred',
      details: JSON.stringify(error, null, 2),
    };
  }

  if (typeof error === 'string') {
    return normalizeErrorMessage(error);
  }

  if (error instanceof Error) {
    return normalizeErrorMessage(error.message, error);
  }

  return {
    message: 'An unexpected error occurred',
  };
}

function normalizeErrorMessage(message: string, originalError?: unknown): NormalizedError {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('insufficient funds') &&
    lowerMessage.includes('intrinsic transaction cost')
  ) {
    return {
      title: 'System Wallet Has Insufficient Balance',
      message: 'The server wallet needs MATIC (Polygon\'s native token) to pay for transaction gas fees.',
      details: 'Please fund the server wallet with MATIC to continue processing orders.',
      action: 'Contact support or check server wallet balance',
    };
  }

  if (lowerMessage.includes('insufficient funds') || lowerMessage.includes('insufficient_funds')) {
    if (lowerMessage.includes('matic') || lowerMessage.includes('gas')) {
      return {
        title: 'Insufficient MATIC for Gas',
        message: 'Not enough MATIC to pay for transaction gas fees.',
        details: 'Please add MATIC to your wallet to continue.',
      };
    }
    return {
      title: 'Insufficient Funds',
      message: 'You don\'t have enough funds to complete this transaction.',
    };
  }

  if (lowerMessage.includes('insufficient allowance')) {
    return {
      title: 'Insufficient USDC Allowance',
      message: 'You need to approve USDC spending before placing this order.',
      details: 'Click "Approve USDC Spending" to grant permission.',
      action: 'Approve USDC Spending',
    };
  }

  if (lowerMessage.includes('insufficient usdc balance') || lowerMessage.includes('insufficient balance')) {
    return {
      title: 'Insufficient USDC Balance',
      message: 'You don\'t have enough USDC to complete this order.',
      details: 'Please add USDC to your wallet.',
    };
  }

  if (
    lowerMessage.includes('user rejected') ||
    lowerMessage.includes('user denied') ||
    lowerMessage.includes('rejected') ||
    lowerMessage.includes('denied transaction')
  ) {
    return {
      title: 'Transaction Rejected',
      message: 'You rejected the transaction in your wallet.',
      details: 'No changes were made.',
    };
  }

  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('rpc') ||
    lowerMessage.includes('connection')
  ) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the blockchain network.',
      details: 'Please check your internet connection and try again.',
    };
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return {
      title: 'Transaction Timeout',
      message: 'The transaction took too long to complete.',
      details: 'Please try again. The transaction may still be processing.',
    };
  }

  if (lowerMessage.includes('order') && lowerMessage.includes('not found')) {
    return {
      title: 'Order Not Found',
      message: 'The order you are looking for could not be found.',
      details: 'The order may have been deleted or the ID may be incorrect. Please check the order ID and try again.',
    };
  }

  if (lowerMessage.includes('market') && lowerMessage.includes('not found')) {
    return {
      title: 'Market Not Found',
      message: 'The market you are looking for could not be found.',
      details: 'The market may have been removed or the ID may be incorrect.',
    };
  }

  if (lowerMessage.includes('market not active') || lowerMessage.includes('market is closed')) {
    return {
      title: 'Market Not Available',
      message: 'This market is not currently accepting orders.',
      details: 'The market may be closed or inactive.',
    };
  }

  if (lowerMessage.includes('cannot be cancelled') || lowerMessage.includes('not cancellable')) {
    if (lowerMessage.includes('filled')) {
      return {
        title: 'Order Already Filled',
        message: 'This order has already been filled and cannot be cancelled.',
        details: 'Filled orders cannot be cancelled. If you need to close your position, you can place an opposite order.',
      };
    }
    if (lowerMessage.includes('cancelled')) {
      return {
        title: 'Order Already Cancelled',
        message: 'This order has already been cancelled.',
      };
    }
    if (lowerMessage.includes('failed')) {
      return {
        title: 'Order Failed',
        message: 'This order has failed and cannot be cancelled.',
        details: 'Failed orders are already in a final state.',
      };
    }
    if (lowerMessage.includes('processing')) {
      return {
        title: 'Order Being Processed',
        message: 'This order is currently being processed and cannot be cancelled.',
        details: 'Please wait for the order to complete or fail.',
      };
    }
    return {
      title: 'Cannot Cancel Order',
      message: 'This order cannot be cancelled in its current state.',
      details: 'Only pending or queued orders can be cancelled.',
    };
  }

  if (lowerMessage.includes('signature') || lowerMessage.includes('invalid signature')) {
    return {
      title: 'Signature Error',
      message: 'There was an issue with the transaction signature.',
      details: 'Please try again or reconnect your wallet.',
    };
  }

  if (lowerMessage.includes('wallet') && lowerMessage.includes('connect')) {
    return {
      title: 'Wallet Connection Error',
      message: 'Unable to connect to your wallet.',
      details: 'Please make sure your wallet is unlocked and try again.',
    };
  }

  if (lowerMessage.includes('api') || lowerMessage.includes('server error')) {
    return {
      title: 'Server Error',
      message: 'An error occurred while processing your request.',
      details: 'Please try again in a few moments.',
    };
  }

  let cleanedMessage = message;
  
  cleanedMessage = cleanedMessage.replace(/\[ See: https?:\/\/[^\]]+\]/gi, '');
  
  cleanedMessage = cleanedMessage.replace(/\(error=\{[\s\S]*?\}\)$/, '');
  
  cleanedMessage = cleanedMessage.replace(/, method="[^"]+"/gi, '');
  cleanedMessage = cleanedMessage.replace(/, transaction=\{[\s\S]*?\}$/, '');
  
  cleanedMessage = cleanedMessage.replace(/, version=[^\s]+/gi, '');
  
  cleanedMessage = cleanedMessage.trim().replace(/\s+/g, ' ');

  if (cleanedMessage.length > 200 || cleanedMessage.includes('{') || cleanedMessage.includes('"code"')) {
    return {
      title: 'Transaction Failed',
      message: 'The transaction could not be completed.',
      details: cleanedMessage.substring(0, 200) + (cleanedMessage.length > 200 ? '...' : ''),
    };
  }

  return {
    message: cleanedMessage,
  };
}

export function formatErrorForDisplay(error: unknown): string {
  const normalized = normalizeError(error);
  return normalized.message;
}

export function getShortErrorMessage(error: unknown): string {
  const normalized = normalizeError(error);
  return normalized.title || normalized.message;
}

