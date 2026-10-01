import type { TSurveyType } from "@formbricks/types/surveys/types";
import { parseV3ApiError } from "@/modules/api/lib/v3-client";
import { pushDataLayer } from "../../../../../../../src/lib/data-layer";

type TV3SurveyCreateResponse = {
  data: {
    id: string;
  };
};

export type TV3TemplateSource = "catalog" | "custom" | "xm";

export type TCreateSurveyFromTemplateInput = {
  workspaceId: string;
  templateId: string;
  source: TV3TemplateSource;
  surveyType: TSurveyType;
  /** The survey's default language — see `resolveDefaultSurveyLanguage`. Not the creator's UI locale. */
  defaultLanguage: string;
};

export async function createSurveyFromTemplate({
  workspaceId,
  templateId,
  source,
  surveyType,
  defaultLanguage,
}: TCreateSurveyFromTemplateInput): Promise<TV3SurveyCreateResponse["data"]> {
  const response = await fetch("/api/v3/surveys/templates", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workspaceId,
      templateId,
      source,
      surveyType,
      defaultLanguage,
    }),
  });

  if (!response.ok) {
    const error = await parseV3ApiError(response);
    const failureCategory =
      response.status === 400 && error.invalid_params?.some((param) => param.name === "templateId")
        ? "invalid_template"
        : response.status === 400 || response.status === 422
          ? "validation"
          : response.status === 401 || response.status === 403
            ? "permission"
            : "server_error";

    pushDataLayer("template_survey_creation_failed", {
      template_source: source,
      failure_category: failureCategory,
      http_status: response.status,
    });
    throw error;
  }

  const body = (await response.json()) as TV3SurveyCreateResponse;
  if (response.status === 201) {
    pushDataLayer("survey_created", { survey_type: surveyType });
    pushDataLayer("template_survey_created", {
      template_source: source,
      survey_type: surveyType,
      created_from: "template",
    });
  }
  return body.data;
}
