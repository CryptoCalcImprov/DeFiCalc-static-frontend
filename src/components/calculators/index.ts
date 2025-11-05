import type { CalculatorDefinition } from "@/components/calculators/types";
import { dcaCalculatorDefinition } from "@/components/calculators/dca/dca-calculator";
import { buyTheDipCalculatorDefinition } from "@/components/calculators/buy-the-dip/buy-the-dip-calculator";
import { trendFollowingCalculatorDefinition } from "@/components/calculators/trend-following/trend-following-calculator";

export const calculatorDefinitions = [
  dcaCalculatorDefinition,
  buyTheDipCalculatorDefinition,
  trendFollowingCalculatorDefinition,
] as CalculatorDefinition<any>[];

export function findCalculatorDefinition<CalculatorState>(id: string) {
  return calculatorDefinitions.find((definition) => definition.id === id) as
    | CalculatorDefinition<CalculatorState>
    | undefined;
}
