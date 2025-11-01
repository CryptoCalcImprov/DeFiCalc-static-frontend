import type { FormEvent } from "react";

export type TimeSeriesPoint = {
  date: string;
  price: number;
};

export type CalculatorResult = {
  summary: string;
  dataset: TimeSeriesPoint[];
};

export type CalculatorFormChangeHandler<FormState> = <Field extends keyof FormState>(
  field: Field,
  value: FormState[Field],
) => void;

export type CalculatorFormProps<FormState> = {
  formState: FormState;
  onFormStateChange: CalculatorFormChangeHandler<FormState>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error: string | null;
};

export type CalculatorRequestConfig = {
  prompt: string;
  options?: Partial<RequestInit>;
};

export type CalculatorDefinition<FormState> = {
  id: string;
  label: string;
  description?: string;
  Form: (props: CalculatorFormProps<FormState>) => JSX.Element;
  getInitialState: () => FormState;
  getRequestConfig: (formState: FormState) => CalculatorRequestConfig;
  parseReply: (reply: string) => CalculatorResult;
  formatSummary?: (summary: string) => string[];
  getSeriesLabel?: (formState: FormState) => string;
  initialSummary?: string;
  pendingSummary?: string;
};
