import { describe, expect, it } from "vitest";
import { computeDecisionOutcome } from "./application-decision";

describe("computeDecisionOutcome", () => {
  it("APPROVE on a non-final step moves to PENDING at the next step", () => {
    expect(computeDecisionOutcome(0, 3, "APPROVE")).toEqual({ status: "PENDING", nextStep: 1 });
    expect(computeDecisionOutcome(1, 3, "APPROVE")).toEqual({ status: "PENDING", nextStep: 2 });
  });

  it("APPROVE on the final step completes the application (APPROVED)", () => {
    expect(computeDecisionOutcome(2, 3, "APPROVE")).toEqual({ status: "APPROVED", nextStep: 2 });
  });

  it("APPROVE on a single-step template completes immediately", () => {
    expect(computeDecisionOutcome(0, 1, "APPROVE")).toEqual({ status: "APPROVED", nextStep: 0 });
  });

  it("REJECT ends the application regardless of which step it's on", () => {
    expect(computeDecisionOutcome(0, 3, "REJECT")).toEqual({ status: "REJECTED", nextStep: 0 });
    expect(computeDecisionOutcome(2, 3, "REJECT")).toEqual({ status: "REJECTED", nextStep: 2 });
  });

  it("RETURN sends it back to the applicant, staying at the current step (reset happens on resubmit)", () => {
    expect(computeDecisionOutcome(1, 3, "RETURN")).toEqual({ status: "RETURNED", nextStep: 1 });
  });
});
