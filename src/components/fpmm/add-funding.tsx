import { Address, erc20Abi, getAddress, getContract, parseUnits } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { fixedProductMarketMakerAbi } from "@/abis";
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

interface AddFundingArgs {
  marketAddr: Address;
  funding: string;
}
export interface IAddFunding {}

export const AddFunding = ({}: IAddFunding) => {
  const client = usePublicClient();
  const { toast } = useToast();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { register, handleSubmit } = useForm<AddFundingArgs>();
  const { mutateAsync: addFunding, isPending } = useMutation({
    mutationKey: ["addFunding"],
    mutationFn: async (data: AddFundingArgs) => {
      let tx: `0x${string}`;
      const [marketAddr] = [getAddress(data.marketAddr)];
      const fpmm = getContract({
        abi: fixedProductMarketMakerAbi,
        address: getAddress(data.marketAddr),
        client: client!,
      });
      const collateralTokenAddr = (await fpmm.read.collateralToken()) as string;
      const erc20 = getContract({
        abi: erc20Abi,
        address: getAddress(collateralTokenAddr),
        client: client!,
      });

      const collateralDecimals = await erc20.read.decimals();
      const funding = parseUnits(data.funding, collateralDecimals);
      const allowance = await erc20.read.allowance([
        address!,
        getAddress(data.marketAddr),
      ]);
      if (allowance < funding) {
        toast({
          title: "Approval Needed",
          description: "Prompting to integrated web3 wallet for approve spend.",
        });

        tx = await writeContractAsync({
          abi: erc20Abi,
          functionName: "approve",
          args: [marketAddr, funding],
          address: getAddress(collateralTokenAddr),
        });
        toast({
          title: "Transaction Submitted",
          description: "Successfully submitted transaction.",
        });

        await client!.waitForTransactionReceipt({
          hash: tx,
        });
        toast({
          title: "Transaction Confirmed",
          description: "The transaction has been confirmed.",
        });
      }

      toast({
        title: "Add Funding",
        description: "Submitting add funding transaction.",
      });
      tx = await writeContractAsync({
        abi: fixedProductMarketMakerAbi,
        functionName: "addFunding",
        args: [funding, []],
        address: getAddress(data.marketAddr),
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
  const onSubmit: SubmitHandler<AddFundingArgs> = async (data) =>
    addFunding(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-auto">
        <CardHeader>
          <CardTitle>Add Funding</CardTitle>
          <CardDescription>Add funding to a market.</CardDescription>
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
              <Label htmlFor="funding">Funding</Label>
              <Input
                id="funding"
                placeholder="Funding"
                defaultValue={"0"}
                {...register("funding")}
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
