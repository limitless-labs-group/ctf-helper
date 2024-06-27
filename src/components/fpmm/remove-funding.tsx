import { Address, erc20Abi, getAddress, getContract, parseUnits } from "viem";
import { conditionalTokensAbi, fixedProductMarketMakerAbi } from "@/abis";
import { usePublicClient, useWriteContract } from "wagmi";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RemoveFundingArgs {
  marketAddr: Address;
  sharesToBurn: string;
}
export interface IRemoveFunding {}

export const RemoveFunding = ({}: IRemoveFunding) => {
  const client = usePublicClient();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const { register, handleSubmit } = useForm<RemoveFundingArgs>();
  const { mutateAsync: removeFunding, isPending } = useMutation({
    mutationKey: ["removeFunding"],
    mutationFn: async (data: RemoveFundingArgs) => {
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

      toast({
        title: "ConditionalTokens Approval",
        description:
          "Submitting approval for all ERC1155 transfer transaction.",
      });
      tx = await writeContractAsync({
        abi: conditionalTokensAbi,
        functionName: "setApprovalForAll",
        args: [marketAddr, true],
        address: getAddress(conditionalTokensAddr),
      });
      await client!.waitForTransactionReceipt({
        hash: tx,
      });
      toast({
        title: "Transaction Confirmed",
        description: "The transaction has been confirmed.",
      });

      toast({
        title: "Remove Funding",
        description: "Submitting remove funding transaction.",
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
  const onSubmit: SubmitHandler<RemoveFundingArgs> = async (data) =>
    removeFunding(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-auto">
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
