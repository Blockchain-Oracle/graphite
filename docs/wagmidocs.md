# Writing to Smart Contracts with Wagmi

This guide explains how to interact with blockchain by sending transactions to smart contracts.

## Prerequisites
- Follow the [Connect Wallet guide](link-to-connect-wallet-guide) to set up wallet connectivity.

## Step 1: Create Your Component

Create a new component that will handle the contract write operation:

```jsx
// mint-nft.tsx
import * as React from 'react'
 
export function MintNFT() {
  return (
    <form>
      <input name="tokenId" placeholder="69420" required />
      <button type="submit">Mint</button>
    </form>
  )
}
```

## Step 2: Add a Form Handler

Next, add a handler for form submission:

```jsx
// mint-nft.tsx
import * as React from 'react'
 
export function MintNFT() {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const tokenId = formData.get('tokenId') as string
  }

  return (
    <form onSubmit={submit}>
      <input name="tokenId" placeholder="69420" required />
      <button type="submit">Mint</button>
    </form>
  )
}
```

## Step 3: Use the useWriteContract Hook

Now implement the actual contract interaction:

```jsx
// mint-nft.tsx
import * as React from 'react'
import { useWriteContract } from 'wagmi'
import { abi } from './abi'
 
export function MintNFT() {
  const { data: hash, writeContract } = useWriteContract()

  async function submit(e: React.FormEvent<HTMLFormElement>) { 
    e.preventDefault() 
    const formData = new FormData(e.target as HTMLFormElement) 
    const tokenId = formData.get('tokenId') as string 
    writeContract({
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi,
      functionName: 'mint',
      args: [BigInt(tokenId)],
    })
  } 

  return (
    <form onSubmit={submit}>
      <input name="tokenId" placeholder="69420" required />
      <button type="submit">Mint</button>
      {hash && <div>Transaction Hash: {hash}</div>}
    </form>
  )
}
```

## Step 4: Add Loading State (Optional)

Improve the UX by adding a loading state:

```jsx
// mint-nft.tsx
import * as React from 'react'
import { useWriteContract } from 'wagmi'
import { abi } from './abi'
 
export function MintNFT() {
  const { 
    data: hash, 
    isPending,
    writeContract 
  } = useWriteContract() 

  async function submit(e: React.FormEvent<HTMLFormElement>) { 
    e.preventDefault() 
    const formData = new FormData(e.target as HTMLFormElement) 
    const tokenId = formData.get('tokenId') as string 
    writeContract({
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi,
      functionName: 'mint',
      args: [BigInt(tokenId)],
    })
  } 

  return (
    <form onSubmit={submit}>
      <input name="tokenId" placeholder="69420" required />
      <button 
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Confirming...' : 'Mint'}
      </button>
      {hash && <div>Transaction Hash: {hash}</div>}
    </form>
  )
}
```

## Step 5: Wait for Transaction Receipt (Optional)

Add transaction confirmation status:

```jsx
// mint-nft.tsx
import * as React from 'react'
import { 
  useWaitForTransactionReceipt,
  useWriteContract 
} from 'wagmi'
import { abi } from './abi'
 
export function MintNFT() {
  const { 
    data: hash, 
    isPending, 
    writeContract 
  } = useWriteContract() 

  async function submit(e: React.FormEvent<HTMLFormElement>) { 
    e.preventDefault() 
    const formData = new FormData(e.target as HTMLFormElement) 
    const tokenId = formData.get('tokenId') as string 
    writeContract({
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi,
      functionName: 'mint',
      args: [BigInt(tokenId)],
    })
  } 

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  return (
    <form onSubmit={submit}>
      <input name="tokenId" placeholder="69420" required />
      <button 
        disabled={isPending} 
        type="submit"
      >
        {isPending ? 'Confirming...' : 'Mint'} 
      </button>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <div>Transaction confirmed.</div>}
    </form>
  )
}
```

## Step 6: Handle Errors (Optional)

Add proper error handling:

```jsx
// mint-nft.tsx
import * as React from 'react'
import { 
  type BaseError,
  useWaitForTransactionReceipt, 
  useWriteContract 
} from 'wagmi'
import { abi } from './abi'
 
export function MintNFT() {
  const { 
    data: hash,
    error,
    isPending, 
    writeContract 
  } = useWriteContract() 

  async function submit(e: React.FormEvent<HTMLFormElement>) { 
    e.preventDefault() 
    const formData = new FormData(e.target as HTMLFormElement) 
    const tokenId = formData.get('tokenId') as string 
    writeContract({
      address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
      abi,
      functionName: 'mint',
      args: [BigInt(tokenId)],
    })
  } 

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    }) 

  return (
    <form onSubmit={submit}>
      <input name="tokenId" placeholder="69420" required />
      <button 
        disabled={isPending} 
        type="submit"
      >
        {isPending ? 'Confirming...' : 'Mint'} 
      </button>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>} 
      {isConfirmed && <div>Transaction confirmed.</div>} 
      {error && (
        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
      )}
    </form>
  )
}
```

## Step 7: Add to Your Application

Finally, connect your component to your application:

```jsx
// app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from './config'
import { MintNFT } from './mint-nft'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}> 
        <MintNFT />
      </QueryClientProvider> 
    </WagmiProvider>
  )
}
```

## 2. TanStack Query Integration

```markdown
# TanStack Query Integration with Wagmi

Wagmi hooks are built on TanStack Query, providing a powerful system for fetching, caching, synchronizing, and updating data in React applications.

## Concepts

### Queries & Mutations

- **Queries**: Used for fetching data (e.g., reading from contracts)
- **Mutations**: Used for modifying data (e.g., writing to contracts)

### Key Terms

- **Query**: Asynchronous data fetching operation tied to a unique Query Key
- **Mutation**: Asynchronous data mutation operation
- **Query Key**: Unique identifier for a query
- **Stale Data**: Data that's unused or inactive after a period of time
- **Query Fetching**: Invoking an async query function
- **Query Refetching**: Refreshing rendered queries
- **Query Invalidation**: Marking query data as stale
- **Query Prefetching**: Preloading queries to seed the cache

## External Storage Persistence

By default, TanStack Query stores data in-memory. To persist across page refreshes, you can use external storage.

### Sync Storage (localStorage/sessionStorage)

#### Installation

```bash
pnpm i @tanstack/query-sync-storage-persister @tanstack/react-query-persist-client
```

#### Usage

```jsx
// 1. Import modules
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { WagmiProvider, deserialize, serialize } from 'wagmi'

// 2. Create a QueryClient with default gcTime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1_000 * 60 * 60 * 24, // 24 hours
    },
  },
})

// 3. Set up the persister
const persister = createSyncStoragePersister({
  serialize,
  storage: window.localStorage,
  deserialize,
})

function App() {
  return (
    <WagmiProvider config={config}>
      {/* 4. Wrap app in PersistQueryClientProvider */}
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        {/* Your app components */}
      </PersistQueryClientProvider>
    </WagmiProvider>
  )
}
```

### Async Storage (IndexedDB/AsyncStorage)

#### Installation

```bash
pnpm i @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
```

#### Usage

```jsx
// 1. Import modules
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { WagmiProvider, deserialize, serialize } from 'wagmi'

// 2. Create a QueryClient with default gcTime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1_000 * 60 * 60 * 24, // 24 hours
    },
  },
})

// 3. Set up the persister
const persister = createAsyncStoragePersister({
  serialize,
  storage: AsyncStorage,
  deserialize,
})

function App() {
  return (
    <WagmiProvider config={config}>
      {/* 4. Wrap app in PersistQueryClientProvider */}
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        {/* Your app components */}
      </PersistQueryClientProvider>
    </WagmiProvider>
  )
}
```

## Working with Query Keys

Query Keys are used for invalidation, refetching, prefetching, and other operations.

### Hook Method (React)

```jsx
import { useBlock } from 'wagmi'

function App() {
  const { queryKey } = useBlock()
}
```

### Import Method (Vanilla JS)

```jsx
import { getBlockQueryOptions } from 'wagmi/query'
import { config } from './config'

function perform() {
  const { queryKey } = getBlockQueryOptions(config, { 
    chainId: config.state.chainId
  })
}
```

> **Warning**: The import method doesn't handle reactivity automatically - you need to pass updated arguments explicitly.

## Query Operations

### Invalidating Queries

Marking queries as stale and triggering refetches.

#### Example: Watching User Balance

```jsx
import { useQueryClient } from '@tanstack/react-query' 
import { useEffect } from 'react' 
import { useBlockNumber, useBalance } from 'wagmi' 

function App() {
  const queryClient = useQueryClient()
  const { data: blockNumber } = useBlockNumber({ watch: true })
  const { data: balance, queryKey } = useBalance()
  
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [blockNumber])

  return <div>{balance}</div>
}
```

#### Example: After User Interaction

```jsx
import { useBalance } from 'wagmi'

function App() {
  // 1. Extract queryKey from useBalance
  const { queryKey } = useBalance()

  return (
    <button
      onClick={async () => {
        // 2. Invalidate the query on button click
        await queryClient.invalidateQueries({ queryKey })
      }}
    >
      Invalidate
    </button>
  )
}

function Example() {
  // 3. This component's data will be refetched after invalidation
  const { data: balance } = useBalance()
  return <div>{balance}</div>
}
```

### Fetching Queries

```jsx
// example.tsx
import { getBlockQueryOptions } from 'wagmi'
import { queryClient } from './app'
import { config } from './config'

export async function fetchBlockData() {
  return queryClient.fetchQuery(
    getBlockQueryOptions(config, {
      chainId: config.state.chainId,
    }
  ))
}
```

### Retrieving & Updating Query Data

```jsx
// example.tsx
import { getBlockQueryOptions } from 'wagmi'
import type { Block } from 'viem'
import { queryClient } from './app'
import { config } from './config'

export function getPendingBlockData() {
  return queryClient.getQueryData(
    getBlockQueryOptions(config, {
      chainId: config.state.chainId,
      tag: 'pending'
    }
  ))
}

export function setPendingBlockData(data: Block) {
  return queryClient.setQueryData(
    getBlockQueryOptions(config, {
      chainId: config.state.chainId,
      tag: 'pending'
    },
    data
  ))
}
```

### Prefetching Queries

```jsx
import { Link } from 'next/link'
import { getBlockQueryOptions } from 'wagmi'

function App() {
  const config = useConfig()
  const chainId = useChainId()

  // 1. Set up prefetch function
  const prefetch = () =>
    queryClient.prefetchQuery(getBlockQueryOptions(config, { chainId }))
  
  return (
    <Link
      // 2. Add event handlers to prefetch data
      onMouseEnter={prefetch}
      onFocus={prefetch}
      to="/block-details"
    >
      Block details
    </Link>
  )
}
```

## DevTools Integration

TanStack Query includes DevTools for visualizing query states.

### Installation

```bash
pnpm i @tanstack/react-query-devtools
```

### Usage

```jsx
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { hashFn } from "@wagmi/core/query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: hashFn,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## 3. Reading from Contracts

```markdown
# Reading from Smart Contracts with Wagmi

The `useReadContract` hook allows you to read data from smart contracts without requiring gas or changing state.

## Basic Usage

Use `useReadContract` to call read-only functions on a contract:

```jsx
// read-contract.tsx
import { useReadContract } from 'wagmi'
import { wagmiContractConfig } from './contracts'

function ReadContract() {
  const { data: balance } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'balanceOf',
    args: ['0x03A71968491d55603FFe1b11A9e23eF013f75bCF'],
  })

  return (
    <div>Balance: {balance?.toString()}</div>
  )
}
```

## Dependent Queries

If your query depends on another value, use the `enabled` option:

```jsx
const { data: balance } = useReadContract({
  ...wagmiContractConfig,
  functionName: 'balanceOf',
  args: [address],
  query: {
    enabled: !!address,
  },
})
```

## Handling Loading & Error States

```jsx
import { type BaseError, useReadContract } from 'wagmi'

function ReadContract() {
  const { 
    data: balance,
    error,
    isPending
  } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'balanceOf',
    args: ['0x03A71968491d55603FFe1b11A9e23eF013f75bCF'],
  })

  if (isPending) return <div>Loading...</div>

  if (error)
    return (
      <div>
        Error: {(error as BaseError).shortMessage || error.message}
      </div>
    )

  return (
    <div>Balance: {balance?.toString()}</div>
  )
}
```

## Refetching On Block Updates

```jsx
import { useEffect } from 'react'
import { useBlockNumber, useReadContract } from 'wagmi'

function ReadContract() {
  const { data: balance, refetch } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'balanceOf',
    args: ['0x03A71968491d55603FFe1b11A9e23eF013f75bCF'],
  })
  const { data: blockNumber } = useBlockNumber({ watch: true })

  useEffect(() => {
    // Want to refetch every `n` blocks instead? Use the modulo operator:
    // if (blockNumber % 5 === 0) refetch() // refetch every 5 blocks
    refetch()
  }, [blockNumber])

  return (
    <div>Balance: {balance?.toString()}</div>
  )
}
```

## Calling Multiple Functions

For better organization when calling multiple contract functions, use `useReadContracts`:

```jsx
import { type BaseError, useReadContracts } from 'wagmi'

function ReadContract() {
  const { 
    data,
    error,
    isPending
  } = useReadContracts({ 
    contracts: [{ 
      ...wagmiContractConfig,
      functionName: 'balanceOf',
      args: ['0x03A71968491d55603FFe1b11A9e23eF013f75bCF'],
    }, { 
      ...wagmiContractConfig, 
      functionName: 'ownerOf', 
      args: [69n], 
    }, { 
      ...wagmiContractConfig, 
      functionName: 'totalSupply', 
    }] 
  }) 
  const [balance, ownerOf, totalSupply] = data || [] 

  if (isPending) return <div>Loading...</div>

  if (error)
    return (
      <div>
        Error: {(error as BaseError).shortMessage || error.message}
      </div>
    ) 

  return (
    <>
      <div>Balance: {balance?.toString()}</div>
      <div>Owner of Token 69: {ownerOf?.toString()}</div> 
      <div>Total Supply: {totalSupply?.toString()}</div> 
    </>
  )
}