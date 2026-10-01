import { handleSubject } from "./_subject";
export const onRequestGet: PagesFunction = (context) =>
  handleSubject("ondo", context as never);
export const onRequestPost = onRequestGet;
