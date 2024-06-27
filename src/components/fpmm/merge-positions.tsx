import { conditionalTokensAbi, fixedProductMarketMakerAbi } from "@/abis";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { Address, getAddress, getContract, zeroHash } from "viem";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Card,
  CardDescription,
} from "@/components/ui/card";

interface MergePositionsArgs {
  marketAddr: Address;
}
export interface IMergePositions {}

export const MergePositions = ({}: IMergePositions) => {
  const client = usePublicClient();
  const { toast } = useToast();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { register, handleSubmit } = useForm<MergePositionsArgs>();
  const { mutateAsync: mergePositions, isPending } = useMutation({
    mutationKey: ["mergePositions"],
    mutationFn: async (data: MergePositionsArgs) => {
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

      toast({
        title: "Merge Positions",
        description:
          "Please confirm the transaction in your integrated browser wallet.",
      });
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
      toast({
        title: "Transaction Confirmed",
        description: "The transaction has been confirmed.",
      });
    },
    onError(error, variables, context) {
      console.error({ error, variables, context });
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    },
  });
  const onSubmit: SubmitHandler<MergePositionsArgs> = async (data) =>
    mergePositions(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-auto">
        <CardHeader>
          <CardTitle>Merge Positions</CardTitle>
          <CardDescription>Call merge positions from conditional tokens contract.</CardDescription>
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
        <CardFooter className="flex justify-start">
          <Button size="lg" type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              "Execute"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
