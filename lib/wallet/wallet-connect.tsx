'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { toast } from 'sonner';
import { wagmiConfig } from './wallet-config';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showModal, setShowModal] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isMetaMaskProvider, setIsMetaMaskProvider] = useState(false);

  const expectedChainId = wagmiConfig.chains[0]?.id;

      useEffect(() => {
        if (typeof window !== 'undefined') {
          const ethereum = window.ethereum;
          setHasMetaMask(!!ethereum);
          setIsMetaMaskProvider(
            !!ethereum &&
            (ethereum.isMetaMask || 
             (ethereum.providers && ethereum.providers.some((p: any) => p.isMetaMask)))
          );
        }
      }, []);

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

  if (!projectId) {
    return (
      <Button variant="outline" disabled className="rounded-none border-black">
        WalletConnect Not Configured
      </Button>
    );
  }

  const handleConnect = async (connector: any) => {
    try {
      await connect(
        { connector },
        {
          onSuccess: async (data) => {
            // After successful connection, check if we need to switch chains
            if (expectedChainId && data.chainId !== expectedChainId) {
              try {
                await switchChain({ chainId: expectedChainId });
                toast.success(`Switched to ${wagmiConfig.chains[0]?.name}`);
              } catch (switchError: any) {
                if (
                  switchError?.message?.includes('User rejected') ||
                  switchError?.code === 4001
                ) {
                  toast.warning('Please switch to the correct network manually');
                  return;
                }
                console.error('Network switch error:', switchError);
                toast.error('Failed to switch network. Please switch manually.');
              }
            }
          },
          onError: (error: any) => {
            if (
              error?.message?.includes('User rejected') ||
              error?.message?.includes('rejected') ||
              error?.message?.includes('reset') ||
              error?.code === 4001 ||
              error?.code === 'ACTION_REJECTED'
            ) {
              return;
            }
            console.error('Connection error:', error);
            toast.error(error.message || 'Failed to connect wallet');
          },
        }
      );
      setShowModal(false);
    } catch (err: any) {
      if (
        err?.message?.includes('User rejected') ||
        err?.message?.includes('rejected') ||
        err?.code === 4001
      ) {
        console.log('User cancelled connection');
        return;
      }
      console.error('Error connecting:', err);
      toast.error(err.message || 'Failed to connect wallet');
    }
  };

  // Check and prompt for network switch if already connected but on wrong network
  useEffect(() => {
    if (isConnected && chainId && expectedChainId && chainId !== expectedChainId) {
      const chainName = wagmiConfig.chains[0]?.name || 'the correct network';
      const toastId = toast.warning(`Please switch to ${chainName}`, {
        action: {
          label: 'Switch Now',
          onClick: async () => {
            try {
              await switchChain({ chainId: expectedChainId });
              toast.dismiss(toastId);
              toast.success(`Switched to ${chainName}`);
            } catch (error: any) {
              if (error?.code !== 4001) {
                toast.error('Failed to switch network. Please switch manually in MetaMask.');
              }
            }
          },
        },
        duration: 10000, // Show for 10 seconds
      });
    }
  }, [isConnected, chainId, expectedChainId, switchChain]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="rounded-none border-black cursor-default"
          disabled
        >
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </Button>
        <Button
          variant="destructive"
          onClick={() => disconnect()}
          className="rounded-none border-red-600 bg-red-600 hover:bg-red-700 text-white"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="rounded-none border border-black bg-white hover:bg-gray-50"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to your account
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {(() => {
              const seen = new Set<string>();
              const uniqueConnectors = connectors.filter((connector: any) => {
                const connectorId = connector.id || '';
                const connectorName = (connector.name || '').toLowerCase();
                
                let key = connectorId;
                if (connectorName.includes('metamask')) {
                  key = 'metamask';
                } else if (connectorName.includes('walletconnect')) {
                  key = 'walletconnect';
                }
                
                if (seen.has(key)) {
                  return false;
                }
                seen.add(key);
                return true;
              });

              return uniqueConnectors
                .filter((connector: any) => {
                  const connectorName = (connector.name || '').toLowerCase();
                  const connectorId = connector.id || '';
                  
                  if (connectorId === 'injected' && connectorName === 'injected' && isMetaMaskProvider) {
                    return false;
                  }
                  return true;
                })
                .map((connector: any) => {
                  const connectorId = connector.id || '';
                  const connectorName = (connector.name || '').toLowerCase();
                  
                  let isMetaMask = false;
                  let isWalletConnect = false;
                  let displayName = connector.name || 'Wallet';
                  
                  if (connectorId === 'injected' && isMetaMaskProvider) {
                    isMetaMask = true;
                    displayName = 'MetaMask';
                  } else if (connectorName.includes('metamask')) {
                    isMetaMask = true;
                    displayName = 'MetaMask';
                  } else if (connectorId === 'walletConnect' || connectorName.includes('walletconnect')) {
                    isWalletConnect = true;
                    displayName = 'WalletConnect';
                  }
                  
                  const isAvailable = isMetaMask ? hasMetaMask : true;
                  
                  return (
                    <Button
                      key={connector.id}
                      variant="outline"
                      onClick={() => handleConnect(connector)}
                      disabled={!isAvailable || isPending}
                      className="w-full justify-start rounded-none border-black h-auto py-3"
                    >
                      <div className="flex items-center gap-3 w-full">
                        {isMetaMask ? (
                          <img
                            src="/MetaMask/MetaMask-icon-fox.svg"
                            alt="MetaMask"
                            width={32}
                            height={32}
                            className="shrink-0"
                          />
                        ) : isWalletConnect ? (
                          <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-[#3B99FC] rounded">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM10 18C5.589 18 2 14.411 2 10C2 5.589 5.589 2 10 2C14.411 2 18 5.589 18 10C18 14.411 14.411 18 10 18Z"
                                fill="white"
                              />
                              <path
                                d="M10 4C6.686 4 4 6.686 4 10C4 13.314 6.686 16 10 16C13.314 16 16 13.314 16 10C16 6.686 13.314 4 10 4ZM10 14C7.791 14 6 12.209 6 10C6 7.791 7.791 6 10 6C12.209 6 14 7.791 14 10C14 12.209 12.209 14 10 14Z"
                                fill="white"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 shrink-0 bg-gray-200 rounded" />
                        )}
                        <div className="flex-1 text-left">
                          <div className="font-medium">{displayName}</div>
                          {!isAvailable && (
                            <div className="text-xs text-muted-foreground">
                              {isMetaMask ? 'Install MetaMask' : 'Not available'}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  );
                });
            })()}
            {connectors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No wallets available. Please install a wallet extension.
              </p>
            )}
          </div>
          {error && 
            !error.message?.includes('User rejected') &&
            !error.message?.includes('rejected') &&
            !error.message?.includes('reset') &&
            !error.message?.includes('Connection request reset') && (
            <div className="text-sm text-red-500 mt-2">
              {error.message}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
