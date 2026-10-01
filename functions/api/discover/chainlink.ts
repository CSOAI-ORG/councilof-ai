import { handleSubject } from "./_subject";
export const onRequestGet: PagesFunction = (context) =>
  handleSubject("chainlink", context as never);
export const onRequestPost = onRequestGet;
