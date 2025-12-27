'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { parseUnits } from 'viem';
import { useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import { normalizeError } from '@/lib/utils/error-normalizer';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface UsdcInfo {
  usdcAddress: string;
  serverWallet: string;
  funderAddress: string;
}

export function useUsdcInfo() {
  return useQuery<UsdcInfo>({
    queryKey: ['usdc', 'info'],
    queryFn: async () => {
      const response = await apiClient.get<UsdcInfo>('/orders/usdc/info');
      return response.data;
    },
  });
}

export function useUsdcBalance(address?: string) {
  const { address: connectedAddress } = useAccount();
  const walletAddress = address || connectedAddress;

  return useQuery({
    queryKey: ['usdc', 'balance', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      try {
        const response = await apiClient.get<{ balance: string; address: string }>(
          `/orders/usdc/balance/${walletAddress}`,
        );
        const balance = parseFloat(response.data.balance);
        console.log('USDC Balance fetched:', { walletAddress, balance, raw: response.data.balance });
        return balance;
      } catch (error) {
        console.error('Failed to fetch USDC balance:', error);
        throw error;
      }
    },
    enabled: !!walletAddress,
    retry: 2,
  });
}

export function useUsdcAllowance(address?: string) {
  const { address: connectedAddress } = useAccount();
  const walletAddress = address || connectedAddress;
  const { data: usdcInfo } = useUsdcInfo();

  return useQuery({
    queryKey: ['usdc', 'allowance', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      try {
        const response = await apiClient.get<{
          allowance: string;
          address: string;
          serverWallet: string;
        }>(`/orders/usdc/allowance/${walletAddress}`);
        const allowance = parseFloat(response.data.allowance);
        console.log('USDC Allowance fetched:', { walletAddress, allowance, raw: response.data.allowance });
        return allowance;
      } catch (error) {
        console.error('Failed to fetch USDC allowance:', error);
        throw error;
      }
    },
    enabled: !!walletAddress && !!usdcInfo,
    retry: 2,
  });
}

export function useApproveUsdcMutation() {
  const { address } = useAccount();
  const { data: usdcInfo } = useUsdcInfo();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const queryClient = useQueryClient();
  const confirmationHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (isSuccess && hash && address && confirmationHandledRef.current !== hash) {
      confirmationHandledRef.current = hash;
      queryClient.invalidateQueries({ queryKey: ['usdc', 'allowance', address] });
      queryClient.refetchQueries({ queryKey: ['usdc', 'allowance', address] });
      toast.success('USDC approval confirmed!');
    }
  }, [isSuccess, hash, address, queryClient]);

  const mutation = useMutation({
    mutationFn: async (amount: string): Promise<void> => {
      if (!address || !usdcInfo) {
        throw new Error('Wallet not connected or USDC info not loaded');
      }

      if (error) {
        throw error;
      }

      const decimals = 6;
      const amountWei = parseUnits(amount, decimals);

      confirmationHandledRef.current = null;

      writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [usdcInfo.serverWallet as `0x${string}`, amountWei],
      });

    },
    onSuccess: () => {
    },
    onError: (error: Error) => {
      const normalized = normalizeError(error);
      toast.error(normalized.message);
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending || isPending || isConfirming,
  };
}

export function useNeedsApproval(requiredAmount: number) {
  const { data: allowance } = useUsdcAllowance();
  const currentAllowance = allowance ?? 0;
  return {
    needsApproval: currentAllowance < requiredAmount,
    currentAllowance,
    requiredAmount,
  };
}

export function useGasEstimate() {
  return useQuery({
    queryKey: ['usdc', 'gas-estimate'],
    queryFn: async () => {
      const response = await apiClient.get<{
        estimatedGasMatic: string;
        estimatedGasUsd: string;
        gasPriceGwei: string;
        note: string;
      }>('/orders/usdc/gas-estimate');
      return response.data;
    },
    refetchInterval: 60000, 
  });
}

