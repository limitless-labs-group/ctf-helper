import { conditionalTokensAbi, fixedProductMarketMakerAbi } from "@/abis";
import { Address, getAddress, getContract, zeroHash } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Card,
} from "@/components/ui/card";

interface MergePositionsArgs {
  marketAddr: Address;
}
export interface IMergePositions {}

export const MergePositions = ({}: IMergePositions) => {
  const client = usePublicClient();
  const { address } = useAccount();
  const { register, handleSubmit } = useForm<MergePositionsArgs>();
  const { writeContractAsync } = useWriteContract();

  const onSubmit: SubmitHandler<MergePositionsArgs> = async (data) => {
    console.log("data", data);
    let tx: `0x${string}`;
    const fpmm = getContract({
      abi: fixedProductMarketMakerAbi,
      address: getAddress(data.marketAddr),
      client: client!,
    });
    const [conditionId, collateralTokenAddr, conditionalTokensAddr] =
      await Promise.all([
        fpmm.read.conditionIds([0]) as Promise<string>,
        fpmm.read.collateralToken() as Promise<string>,
        fpmm.read.conditionalTokens() as Promise<string>,
      ]);
    console.log({
      conditionId,
      collateralTokenAddr,
      conditionalTokensAddr,
    });
    const conditionalTokens = getContract({
      abi: conditionalTokensAbi,
      address: getAddress(conditionalTokensAddr),
      client: client!,
    });

    const collectionIds = await Promise.all(
      Array.from({ length: 2 }).map((_: unknown, outcomeIndex: number) => {
        return conditionalTokens.read.getCollectionId([
          zeroHash,
          conditionId,
          1 << outcomeIndex,
        ]) as Promise<string>;
      })
    );
    console.log({ collectionIds });
    const positionIds = await Promise.all(
      collectionIds.map((collectionId) => {
        return conditionalTokens.read.getPositionId([
          collateralTokenAddr,
          collectionId,
        ]) as Promise<bigint>;
      })
    );
    console.log({ positionIds });
    const [yes, no] = await Promise.all(
      positionIds.map((positionId) => {
        return conditionalTokens.read.balanceOf([
          address,
          positionId,
        ]) as Promise<bigint>;
      })
    );
    console.log({ yes, no });

    tx = await writeContractAsync({
      abi: conditionalTokensAbi,
      functionName: "mergePositions",
      args: [
        collateralTokenAddr,
        zeroHash,
        conditionId,
        [1, 2],
        yes < no ? yes : no,
      ],
      address: getAddress(conditionalTokensAddr),
    });
    await client!.waitForTransactionReceipt({
      hash: tx,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Merge Positions</CardTitle>
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
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit">Execute</Button>
        </CardFooter>
      </Card>
    </form>
  );
};
