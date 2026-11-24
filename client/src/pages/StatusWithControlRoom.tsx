import ControlRoom from "./ControlRoom";
import YieldStatus from "./YieldStatus";

/** /status: the control-room strip (headline numbers and history) above the existing service-status rows. */
export default function StatusWithControlRoom() {
  return (
    <>
      <ControlRoom />
      <YieldStatus />
    </>
  );
}
