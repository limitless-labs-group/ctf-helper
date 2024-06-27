import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { createPublicClient } from "viem";

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

export const viemPublicClient = createPublicClient({
  chain: base,
  transport: http(),
});
