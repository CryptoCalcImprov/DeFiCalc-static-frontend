import type { CalculatorDefinition } from "@/components/calculators/types";
import { dcaCalculatorDefinition } from "@/components/calculators/dca/dca-calculator";

export const calculatorDefinitions = [dcaCalculatorDefinition] as CalculatorDefinition<any>[];

export function findCalculatorDefinition<CalculatorState>(id: string) {
  return calculatorDefinitions.find((definition) => definition.id === id) as
    | CalculatorDefinition<CalculatorState>
    | undefined;
}
