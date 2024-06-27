import { fixedProductMarketMakerAbi } from "@/abis";
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
import { useReadContract, useWriteContract } from "wagmi";
import { useForm, SubmitHandler } from "react-hook-form";
import { Address, erc20Abi, getAddress, parseUnits } from "viem";

interface AddFundingArgs {
  marketAddr: Address;
  funding: string;
}
export interface IAddFunding {
  collateralDecimals: number;
}

export const AddFunding = ({ collateralDecimals }: IAddFunding) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddFundingArgs>();
  const { writeContractAsync, isPending } = useWriteContract();

  const onSubmit: SubmitHandler<AddFundingArgs> = async (data) => {
    // viemPublicClient
    
    await writeContractAsync({
      abi: fixedProductMarketMakerAbi,
      functionName: "addFunding",
      args: [parseUnits(data.funding, collateralDecimals)],
      address: getAddress(data.marketAddr),
    });
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="funding">Funding</Label>
              <Input id="funding" placeholder="Funding" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Apply</Button>
      </CardFooter>
    </Card>
  );
};
