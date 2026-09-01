// functions/api/gspc.ts — living board. Slot counts are derived from the payload, never typed.
// Restored from signed board / pre-PR#425 blob b4b3ab1788ec044156da0d4962189fe5f4dd975f.
// Scores are verbatim — nothing invented. Split into private modules for deploy only.

import type { AxisScore } from "./_gspc_types";
import { MEASURED_ON } from "./_gspc_types";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_FIN } from "./_gspc_axes_fin";
import { MEASURED_IN_LANE } from "./_gspc_lane";

PLACEHOLDER_WILL_REPLACE