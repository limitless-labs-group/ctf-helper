import { createConfig, http } from "wagmi";
import { base } from "viem/chains";
import { createPublicClient } from "viem";

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

export const viemPublicClient = createPublicClient({
  chain: base,
  transport: http(),
});
