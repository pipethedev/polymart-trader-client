'use client';

import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import { useCreateOrder } from '@/lib/hooks/use-orders';
import { useUIStore } from '@/lib/store/ui-store';
import { useMarket } from '@/lib/hooks/use-markets';
import { useSignOrderMessage, generateNonce } from '@/lib/wallet/message-signing';
import { useAccount } from 'wagmi';
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

interface FormValues {
  marketId: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  outcome: 'YES' | 'NO';
  quantity: string;
  price: string;
}

const validationSchema = Yup.object().shape({
  marketId: Yup.string().required('Market ID is required'),
  side: Yup.string().oneOf(['BUY', 'SELL'], 'Invalid side').required('Side is required'),
  type: Yup.string().oneOf(['MARKET', 'LIMIT'], 'Invalid order type').required('Order type is required'),
  outcome: Yup.string().oneOf(['YES', 'NO'], 'Invalid outcome').required('Outcome is required'),
  quantity: Yup.string().required('Quantity is required'),
  price: Yup.string().when('type', {
    is: 'LIMIT',
    then: (schema) => schema.required('Price is required for LIMIT orders'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export function CreateOrderForm() {
  const { isCreateOrderDialogOpen, setCreateOrderDialogOpen, createOrderPrefill } = useUIStore();

  const createOrderMutation = useCreateOrder();
  const { address, isConnected } = useAccount();
  const { signOrderMessage } = useSignOrderMessage();
  
  const { data: market } = useMarket(createOrderPrefill?.marketId || null);

  const getInitialValues = (): FormValues => {
    if (createOrderPrefill && isCreateOrderDialogOpen) {
      return {
        marketId: createOrderPrefill.marketId?.toString() || '',
        side: createOrderPrefill.side || 'BUY',
        type: createOrderPrefill.type || 'LIMIT',
        outcome: createOrderPrefill.outcome || 'YES',
        quantity: '',
        price: createOrderPrefill.price || '',
      };
    }
    return {
      marketId: '',
      side: 'BUY',
      type: 'LIMIT',
      outcome: 'YES',
      quantity: '',
      price: '',
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
      toast.error(error.message || 'Failed to create order');
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
              <Form>
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
                    
                <div className={`grid gap-4 ${values.type === 'LIMIT' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Field name="quantity">
                      {({ field }: FieldProps) => (
                        <Input
                          id="quantity"
                          type="text"
                          placeholder="e.g., 100.00000000"
                          {...field}
                        />
                      )}
                    </Field>
                  </div>
                  {values.type === 'LIMIT' && (
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price *</Label>
                      <Field name="price">
                        {({ field }: FieldProps) => (
                          <Input
                            id="price"
                            type="text"
                            placeholder="e.g., 0.65000000"
                            {...field}
                          />
                        )}
                      </Field>
                    </div>
                  )}
                </div>
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
                  disabled={
                    isSubmitting ||
                    createOrderMutation.isPending ||
                    !!(market && (!market.active || market.closed))
                  }
                  className={`border-black rounded bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white hover:bg-gray-900 ${
                    market && (!market.active || market.closed)
                      ? 'disabled:cursor-not-allowed disabled:opacity-50'
                      : ''
                  }`}
                >
                  {createOrderMutation.isPending
                    ? 'Creating...'
                    : market && (!market.active || market.closed)
                      ? 'Market Not Active'
                      : 'Create Order'}
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

