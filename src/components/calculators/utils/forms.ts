import type { CalculatorFormChangeHandler } from "@/components/calculators/types";

/**
 * Creates a helper that maps form field ids to change handlers.
 * Usage: const handleFieldChange = buildFieldChangeHandler(onChange); handleFieldChange("field")(value);
 */
export function buildFieldChangeHandler<FormState>(
  onFormStateChange: CalculatorFormChangeHandler<FormState>,
) {
  return (field: keyof FormState) =>
    (value: FormState[keyof FormState]) => {
      onFormStateChange(field, value as FormState[typeof field]);
    };
}
