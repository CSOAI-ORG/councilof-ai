/** Retired free-rail URL: use the same current overview as /pricing, never a second price page. */
import {onRequest as pricingOverview} from './pricing';
export const onRequest: PagesFunction = ({request}) => {
  if (!['GET','HEAD'].includes(request.method)) {
    return new Response('Read-only navigation', {status:405,headers:{allow:'GET, HEAD','cache-control':'no-store'}});
  }
  return pricingOverview();
};
