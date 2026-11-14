/** Option of a select input. */
export type SelectOption<V extends string | number> = {
  value: V;
  label: string;
};

/** The part of a form submit event that handlers use (keeps tests free of type assertions). */
export type FormSubmitEvent = Pick<React.SubmitEvent<HTMLFormElement>, "preventDefault">;
