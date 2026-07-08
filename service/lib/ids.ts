/** Prefixed random ids — URL-safe hex, prefix telegraphs the record type. */

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Buffer.from(buf).toString("hex");
}

export const newWorkspaceId = () => `ws_${randomHex(8)}`;
export const newOperatorId = () => `op_${randomHex(8)}`;
export const newPocId = () => `poc_${randomHex(8)}`;
export const newEvaluatorId = () => `ev_${randomHex(8)}`;
export const newOtpId = () => `otp_${randomHex(8)}`;
export const newSessionId = () => `sess_${randomHex(24)}`;
export const newGrantId = () => `grant_${randomHex(24)}`;
export const newSignatureId = () => `sig_${randomHex(12)}`;
export const newPublicKey = () => `pocx_pk_${randomHex(12)}`;
export const newSecret = () => `pocx_sk_${randomHex(24)}`;
export const newTicketId = () => `tkt_${randomHex(8)}`;
export const newTicketMessageId = () => `tmsg_${randomHex(8)}`;
