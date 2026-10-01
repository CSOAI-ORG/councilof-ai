import { handleSubject } from "./_subject";
export const onRequestGet: PagesFunction = (context) =>
  handleSubject("ondo-ousg", context as never);
export const onRequestPost = onRequestGet;
