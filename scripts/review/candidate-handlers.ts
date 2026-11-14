/** Selected actual public read handlers for a private, GET-only local integration test. */
export {onRequestGet as board} from '../../functions/api/gspc';
export {onRequestGet as xrpl} from '../../functions/api/xrpl';
export {onRequestGet as swift} from '../../functions/api/swift';
export {onRequestGet as mcp} from '../../functions/api/mcp';
export {onRequestGet as cards} from '../../functions/api/cards';
export {onRequestGet as dashboard} from '../../functions/api/dashboard/stats';
export {onRequestGet as regulator} from '../../functions/api/regulator-findings';
export {onRequestGet as cross} from '../../functions/api/cross';
export {onRequestGet as hub} from '../../functions/api/hub-cards';
export {onRequest as historical} from '../../functions/interop/[[path]]';
