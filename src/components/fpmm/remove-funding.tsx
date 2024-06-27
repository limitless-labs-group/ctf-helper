import { conditionalTokensAbi, fixedProductMarketMakerAbi } from "@/abis";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { usePublicClient, useWriteContract } from "wagmi";
import { useForm, SubmitHandler } from "react-hook-form";
import { Address, erc20Abi, getAddress, getContract, parseUnits } from "viem";

interface RemoveFundingArgs {
  marketAddr: Address;
  sharesToBurn: string;
}
export interface IRemoveFunding {}

export const RemoveFunding = ({}: IRemoveFunding) => {
  const client = usePublicClient();
  const { register, handleSubmit } = useForm<RemoveFundingArgs>();
  const { writeContractAsync } = useWriteContract();

  const onSubmit: SubmitHandler<RemoveFundingArgs> = async (data) => {
    let tx: `0x${string}`;
    const [marketAddr] = [getAddress(data.marketAddr)];
    const fpmm = getContract({
      abi: fixedProductMarketMakerAbi,
      address: getAddress(data.marketAddr),
      client: client!,
    });
    const [conditionalTokensAddr, collateralTokenAddr] = await Promise.all([
      fpmm.read.conditionalTokens() as Promise<string>,
      fpmm.read.collateralToken() as Promise<string>,
    ]);
    const erc20 = getContract({
      abi: erc20Abi,
      address: getAddress(collateralTokenAddr),
      client: client!,
    });

    const collateralDecimals = await erc20.read.decimals();
    const sharesToBurn = parseUnits(data.sharesToBurn, collateralDecimals);

    tx = await writeContractAsync({
      abi: conditionalTokensAbi,
      functionName: "setApprovalForAll",
      args: [marketAddr, true],
      address: getAddress(conditionalTokensAddr),
    });
    await client!.waitForTransactionReceipt({
      hash: tx,
    });

    tx = await writeContractAsync({
      abi: fixedProductMarketMakerAbi,
      functionName: "removeFunding",
      args: [sharesToBurn],
      address: marketAddr,
    });
    await client!.waitForTransactionReceipt({
      hash: tx,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Remove Funding</CardTitle>
          <CardDescription>Remove funding from a market.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="marketAddr">Market Address</Label>
              <Input
                id="marketAddr"
                placeholder="Market Address"
                {...register("marketAddr")}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="sharesToBurn">To Remove</Label>
              <Input
                id="sharesToBurn"
                placeholder="sharesToBurn"
                defaultValue={"0"}
                {...register("sharesToBurn")}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit">Execute</Button>
        </CardFooter>
      </Card>
    </form>
  );
};
