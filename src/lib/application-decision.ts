/**
 * 承認/却下/差し戻しの結果、申請の次の状態がどうなるかを決める純粋なロジック。
 * DB更新(applications/actions.tsのdecideApplication)から分離してテストしやすくしている。
 */

export type DecisionType = "APPROVE" | "REJECT" | "RETURN";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";

export type DecisionOutcome = {
  status: ApplicationStatus;
  nextStep: number;
};

/**
 * @param currentStep 現在の承認段階(0始まり)
 * @param totalSteps  テンプレートの承認段階の総数
 * @param decision    今回下された判定
 */
export function computeDecisionOutcome(
  currentStep: number,
  totalSteps: number,
  decision: DecisionType,
): DecisionOutcome {
  if (decision === "REJECT") {
    return { status: "REJECTED", nextStep: currentStep };
  }
  if (decision === "RETURN") {
    return { status: "RETURNED", nextStep: currentStep };
  }

  const isLastStep = currentStep >= totalSteps - 1;
  return isLastStep
    ? { status: "APPROVED", nextStep: currentStep }
    : { status: "PENDING", nextStep: currentStep + 1 };
}
