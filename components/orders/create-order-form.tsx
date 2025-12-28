'use client';

import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import { useCreateOrder } from '@/lib/hooks/use-orders';
import { useUIStore } from '@/lib/store/ui-store';
import { useMarket } from '@/lib/hooks/use-markets';
import { useSignOrderMessage, generateNonce } from '@/lib/wallet/message-signing';
import { useAccount } from 'wagmi';
import {
  useUsdcBalance,
  useUsdcAllowance,
  useApproveUsdcMutation,
  useGasEstimate,
} from '@/lib/wallet/usdc-approval';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatVolume } from '@/lib/utils/format';
import { toast } from 'sonner';
import { normalizeError } from '@/lib/utils/error-normalizer';

interface FormValues {
  marketId: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  outcome: 'YES' | 'NO';
  quantity: string;
  price: string;
  amount: string;
}

const MINIMUM_ORDER_VALUE = 1.0;

const validationSchema = Yup.object().shape({
  marketId: Yup.string().required('Market ID is required'),
  side: Yup.string().oneOf(['BUY', 'SELL'], 'Invalid side').required('Side is required'),
  type: Yup.string().oneOf(['MARKET', 'LIMIT'], 'Invalid order type').required('Order type is required'),
  outcome: Yup.string().oneOf(['YES', 'NO'], 'Invalid outcome').required('Outcome is required'),
  amount: Yup.string()
    .when('side', {
      is: 'BUY',
      then: (schema) => schema
        .required('Amount is required')
        .test('min-amount', `Minimum order is $${MINIMUM_ORDER_VALUE}`, function (value) {
          if (!value) return false;
          return parseFloat(value) >= MINIMUM_ORDER_VALUE;
        }),
      otherwise: (schema) => schema.notRequired(),
    }),
  price: Yup.string(),
  quantity: Yup.string(),
});

export function CreateOrderForm() {
  const { isCreateOrderDialogOpen, setCreateOrderDialogOpen, createOrderPrefill } = useUIStore();

  const createOrderMutation = useCreateOrder();
  const { address, isConnected } = useAccount();
  const { signOrderMessage } = useSignOrderMessage();
  
  const { data: market } = useMarket(createOrderPrefill?.marketId || null);
  
  const { data: usdcBalance, refetch: refetchBalance } = useUsdcBalance(address);
  const { data: usdcAllowance, refetch: refetchAllowance } = useUsdcAllowance(address);
  const approveUsdcMutation = useApproveUsdcMutation();
  const { data: gasEstimate } = useGasEstimate();

  const getInitialValues = (): FormValues => {
    if (createOrderPrefill && isCreateOrderDialogOpen) {
      return {
        marketId: createOrderPrefill.marketId?.toString() || '',
        side: createOrderPrefill.side || 'BUY',
        type: createOrderPrefill.type || 'LIMIT',
        outcome: createOrderPrefill.outcome || 'YES',
        quantity: '',
        price: createOrderPrefill.price || '',
        amount: '',
      };
    }
    return {
      marketId: '',
      side: 'BUY',
      type: 'LIMIT',
      outcome: 'YES',
      quantity: '',
      price: '',
      amount: '',
    };
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      if (market && (!market.active || market.closed)) {
        return;
      }

      if (!isConnected || !address) {
        toast.error('Please connect your wallet to create an order');
        return;
      }

      if (values.side === 'BUY') {
        if (values.amount) {
          const currentPrice = values.outcome === 'YES' 
            ? parseFloat(market?.outcomeYesPrice || '0.5')
            : parseFloat(market?.outcomeNoPrice || '0.5');
          
          if (currentPrice > 0) {
            values.quantity = (parseFloat(values.amount) / currentPrice).toFixed(8);
            
            if (values.type === 'LIMIT') {
              values.price = currentPrice.toFixed(2);
            }
          }
        }

        const orderAmount = values.amount ? parseFloat(values.amount) : 0;
        const bufferAmount = orderAmount * 0.01;
        const gasFeeUsd = gasEstimate ? parseFloat(gasEstimate.estimatedGasUsd) : 0.0003;
        const requiredUsdc = orderAmount + bufferAmount + gasFeeUsd;
        
        if (usdcBalance === undefined || usdcBalance === null) {
          toast.error('Please wait for your USDC balance to load');
          return;
        }
        
        if (usdcBalance < requiredUsdc) {
          toast.error(
            `Insufficient USDC balance. Required: ${requiredUsdc.toFixed(2)} USDC, Available: ${usdcBalance.toFixed(2)} USDC. ` +
            `Please add more USDC to your wallet.`
          );
          return;
        }

        if (usdcAllowance === undefined || usdcAllowance === null) {
          toast.error('Please wait for your USDC allowance to load');
          return;
        }
        
        if (usdcAllowance < requiredUsdc) {
          const needsApproval = requiredUsdc - usdcAllowance;
          toast.error(
            `Insufficient USDC spending approval. You have approved ${usdcAllowance.toFixed(2)} USDC, but this order requires ${requiredUsdc.toFixed(2)} USDC. ` +
            `Please approve at least ${needsApproval.toFixed(2)} more USDC. Note: Having USDC balance is different from approving spending.`
          );
          return;
        }
      }

      const idempotencyKey = crypto.randomUUID();
      const nonce = generateNonce();

      const orderParams = {
        marketId: parseInt(values.marketId),
        side: values.side,
        type: values.type,
        outcome: values.outcome,
        quantity: values.quantity,
        price: values.type === 'LIMIT' ? values.price : undefined,
      };

      const { signature, message } = await signOrderMessage(orderParams, nonce);

      await createOrderMutation.mutateAsync({
        order: {
          ...orderParams,
          walletAddress: address,
          signature,
          nonce,
        },
        idempotencyKey,
      });

      toast.success('Order created successfully');
      setCreateOrderDialogOpen(false, null);
    } catch (error: any) {
      const normalized = normalizeError(error);
      toast.error(normalized.message);
    }
  };

  return (
    <Dialog open={isCreateOrderDialogOpen} onOpenChange={(open) => setCreateOrderDialogOpen(open, null)}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            {market ? (
              <span>Create an order for: <span className="font-medium">{market.question}</span></span>
            ) : (
              'Create a new order for a market. All fields are required.'
            )}
          </DialogDescription>
        </DialogHeader>
        <Formik
          initialValues={getInitialValues()}
          validationSchema={market && (!market.active || market.closed) ? undefined : validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
          validateOnChange={market ? market.active && !market.closed : true}
          validateOnBlur={market ? market.active && !market.closed : true}
        >
          {({ values, errors, touched, isSubmitting, submitCount }) => {
            const isMarketInactive = market && (!market.active || market.closed);
            
            const errorMessages = isMarketInactive
              ? []
              : Object.keys(errors)
                  .filter((key) => touched[key as keyof FormValues] || submitCount > 0)
                  .map((key) => errors[key as keyof FormValues])
                  .filter((msg): msg is string => typeof msg === 'string');

            const marketErrorMessage = isMarketInactive
              ? market.closed
                ? 'This market is closed and no longer accepting orders.'
                : 'This market is not active. Orders cannot be placed at this time.'
              : null;

            const shouldShowValidationErrors = !isMarketInactive && errorMessages.length > 0;

            return (
              <Form autoComplete="off">
                <div className="grid gap-6 py-4">
                  {(marketErrorMessage || shouldShowValidationErrors) && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
                      <div className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
                        Important message:
                      </div>
                      {marketErrorMessage && (
                        <div className="text-sm text-red-700 dark:text-red-300 mb-2">{marketErrorMessage}</div>
                      )}
                      {shouldShowValidationErrors && (
                        <ul className="list-disc list-inside space-y-1">
                          {errorMessages.map((error, index) => (
                            <li key={index} className="text-sm text-red-700 dark:text-red-300">
                              {error}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {market && (
                    <div className="rounded-lg border p-4 bg-muted/30">
                      <div className="text-sm font-medium mb-2">Market</div>
                      <div className="text-sm text-muted-foreground">{market.question}</div>
                      <div className="flex gap-2 mt-3">
                        {market.closed ? (
                          <Badge variant="error">Closed</Badge>
                        ) : (
                          <Badge variant={market.active ? 'success' : 'error'}>
                            {market.active ? 'Active' : 'Inactive'}
                          </Badge>
                        )}
                        {market.volume && (
                          <Badge variant="outline">Volume: {formatVolume(market.volume)}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="side">Side *</Label>
                    <Field name="side">
                      {({ field, form }: FieldProps) => (
                        <Select
                          value={field.value}
                          onValueChange={(value: 'BUY' | 'SELL') => {
                            form.setFieldValue('side', value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BUY">BUY</SelectItem>
                            <SelectItem value="SELL">SELL</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="outcome">Outcome *</Label>
                    <Field name="outcome">
                      {({ field, form }: FieldProps) => (
                        <Select
                          value={field.value}
                          onValueChange={(value: 'YES' | 'NO') => {
                            form.setFieldValue('outcome', value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="YES">YES</SelectItem>
                            <SelectItem value="NO">NO</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </Field>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Order Type *</Label>
                  <Field name="type">
                    {({ field, form }: FieldProps) => (
                      <Select
                        value={field.value}
                        onValueChange={async (value: 'MARKET' | 'LIMIT') => {
                          form.setFieldValue('type', value);
                          if (value === 'MARKET') {
                            form.setFieldValue('price', '');
                            form.setFieldTouched('price', false);
                            form.setFieldError('price', undefined);
                            await form.validateForm();
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MARKET">MARKET</SelectItem>
                          <SelectItem value="LIMIT">LIMIT</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                </div>
                    
                <div className="grid gap-4">
                  {values.side === 'BUY' && (
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount to Spend (USD) *</Label>
                      <Field name="amount">
                        {({ field, form }: FieldProps) => (
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min={MINIMUM_ORDER_VALUE}
                            placeholder="e.g., 10.00"
                            autoComplete="off"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              const amount = parseFloat(e.target.value);
                              if (!amount) return;
                              
                              const currentPrice = values.outcome === 'YES' 
                                ? parseFloat(market?.outcomeYesPrice || '0.5')
                                : parseFloat(market?.outcomeNoPrice || '0.5');
                              
                              if (currentPrice > 0) {
                                form.setFieldValue('quantity', (amount / currentPrice).toFixed(8));
                                
                                if (values.type === 'LIMIT') {
                                  form.setFieldValue('price', currentPrice.toFixed(2));
                                }
                              }
                            }}
                          />
                        )}
                      </Field>
                    </div>
                  )}
                  <Field name="quantity" type="hidden" />
                  <Field name="price" type="hidden" />
                </div>

                {isConnected && address && values.side === 'BUY' && (
                  <div className="space-y-3 p-4 rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">USDC Information</div>
                    
                    {usdcBalance === undefined || usdcBalance === null ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400">Loading balance...</div>
                    ) : (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Balance: </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{usdcBalance.toFixed(2)} USDC</span>
                      </div>
                    )}

                    {usdcAllowance === undefined || usdcAllowance === null ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400">Loading allowance...</div>
                    ) : (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Approved: </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{usdcAllowance.toFixed(2)} USDC</span>
                      </div>
                    )}

                    {values.amount && parseFloat(values.amount) > 0 && (
                      <>
                        {(() => {
                          const orderAmount = parseFloat(values.amount);
                          const bufferAmount = orderAmount * 0.01;
                          const gasFeeUsd = gasEstimate ? parseFloat(gasEstimate.estimatedGasUsd) : 0.0003;
                          const requiredAmount = orderAmount + bufferAmount + gasFeeUsd;
                            
                          if (usdcBalance === undefined || usdcBalance === null) {
                            return null;
                          }
                          
                          if (usdcBalance < requiredAmount) {
                            return null;
                          }
                          
                          if (usdcAllowance === undefined || usdcAllowance === null) {
                            return null;
                          }
                          
                          const hasInsufficientAllowance = requiredAmount > usdcAllowance;
                          const shouldShowProactiveApproval = usdcAllowance < (requiredAmount * 2);
                          
                          if (hasInsufficientAllowance || shouldShowProactiveApproval) {
                            const approvalAmount = (requiredAmount * 1.2).toFixed(2);
                            
                            return (
                              <div className="space-y-2 mt-3">
                                <div className={`text-sm ${hasInsufficientAllowance ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {hasInsufficientAllowance ? (
                                    <>
                                      Insufficient USDC spending approval. You have approved {usdcAllowance.toFixed(2)} USDC, but need {requiredAmount.toFixed(2)} USDC.
                                      <br />
                                      <span className="text-xs mt-1 block">
                                        Note: Having USDC balance is different from approving spending. Click below to approve more USDC.
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      You have sufficient allowance ({usdcAllowance.toFixed(2)} USDC) for this order, but you can approve more for future larger orders.
                                    </>
                                  )}
                                </div>
                                {gasEstimate && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Includes ~${gasFeeUsd.toFixed(4)} gas fee
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await approveUsdcMutation.mutateAsync(approvalAmount);
                                      setTimeout(() => {
                                        refetchAllowance();
                                      }, 2000);
                                    } catch (error: any) {
                                      const normalized = normalizeError(error);
                                      toast.error(normalized.message);
                                    }
                                  }}
                                  disabled={approveUsdcMutation.isPending}
                                  className="w-full"
                                  variant="outline"
                                >
                                  {approveUsdcMutation.isPending
                                    ? 'Approving...'
                                    : 'Approve USDC Spending'}
                                </Button>
                              </div>
                            );
                          }
                          
                          return null;
                        })()}
                      </>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOrderDialogOpen(false, null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={(() => {  
                    if (isSubmitting || createOrderMutation.isPending) return true;
                    if (market && (!market.active || market.closed)) return true;
                    
                    if (values.side === 'BUY' && isConnected && address && values.amount) {
                      const requiredUsdc = parseFloat(values.amount) * 1.01;
                      
                      if (approveUsdcMutation.isPending) return true;
                      
                      if (usdcBalance !== undefined && usdcBalance !== null && usdcBalance < requiredUsdc) {
                        return true;
                      }
                      
                      if (usdcAllowance !== undefined && usdcAllowance !== null && usdcAllowance < requiredUsdc) {
                        return true;
                      }
                    }
                    
                    return false;
                  })()}
                  className={`border-black rounded bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white hover:bg-gray-900 ${
                    market && (!market.active || market.closed)
                      ? 'disabled:cursor-not-allowed disabled:opacity-50'
                      : ''
                  }`}
                >
                  {(() => {
                    if (createOrderMutation.isPending) return 'Creating...';
                    if (approveUsdcMutation.isPending) return 'Approving...';
                    if (market && (!market.active || market.closed)) return 'Market Not Active';
                    
                    if (values.side === 'BUY' && isConnected && address && values.amount) {
                      const orderAmount = parseFloat(values.amount);
                      
                      const bufferAmount = orderAmount * 0.01;

                      const gasFeeUsd = gasEstimate ? parseFloat(gasEstimate.estimatedGasUsd) : 0.0003;
                      
                      const requiredUsdc = orderAmount + bufferAmount + gasFeeUsd;
                      
                      if (usdcBalance !== undefined && usdcBalance !== null && usdcBalance < requiredUsdc) {
                        return 'Insufficient Balance';
                      }
                      if (usdcAllowance !== undefined && usdcAllowance !== null && usdcAllowance < requiredUsdc) {
                        return 'Approve USDC First';
                      }
                    }
                    
                    return 'Create Order';
                  })()}
                </Button>
              </DialogFooter>
            </Form>
            );
          }}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}

