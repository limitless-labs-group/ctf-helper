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
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useForm, SubmitHandler } from "react-hook-form";
import { Address, erc20Abi, getAddress, getContract, parseUnits } from "viem";
import { viemPublicClient } from "@/config";

interface AddFundingArgs {
  marketAddr: Address;
  funding: string;
}
export interface IAddFunding {}

export const AddFunding = ({}: IAddFunding) => {
  const { address } = useAccount();
  const { register, handleSubmit } = useForm<AddFundingArgs>();
  const { writeContractAsync } = useWriteContract();

  const onSubmit: SubmitHandler<AddFundingArgs> = async (data) => {
    let tx: `0x${string}`;
    const [marketAddr] = [getAddress(data.marketAddr)];
    const fpmm = getContract({
      abi: fixedProductMarketMakerAbi,
      address: getAddress(data.marketAddr),
      client: viemPublicClient,
    });
    const collateralTokenAddr = (await fpmm.read.collateralToken()) as string;
    const erc20 = getContract({
      abi: erc20Abi,
      address: getAddress(collateralTokenAddr),
      client: viemPublicClient,
    });

    const collateralDecimals = await erc20.read.decimals();
    const _funding = parseUnits(data.funding, collateralDecimals);
    const allowance = await erc20.read.allowance([
      address!,
      getAddress(data.marketAddr),
    ]);
    if (allowance < _funding) {
      tx = await writeContractAsync({
        abi: erc20Abi,
        functionName: "approve",
        args: [marketAddr, _funding],
        address: getAddress(collateralTokenAddr),
      });
      await viemPublicClient.waitForTransactionReceipt({
        hash: tx,
      });
    }

    tx = await writeContractAsync({
      abi: fixedProductMarketMakerAbi,
      functionName: "addFunding",
      args: [_funding, []],
      address: getAddress(data.marketAddr),
    });
    await viemPublicClient.waitForTransactionReceipt({
      hash: tx,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="w-[350px]">
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
        <CardFooter className="flex justify-end">
          <Button type="submit">Execute</Button>
        </CardFooter>
      </Card>
    </form>
  );
};
