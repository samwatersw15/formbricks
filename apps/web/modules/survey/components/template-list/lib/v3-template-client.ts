import type { TSurveyType } from "@formbricks/types/surveys/types";
import { pushDataLayer } from "../../../../../../../src/lib/data-layer";
import { parseV3ApiError } from "@/modules/api/lib/v3-client";

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
    try {
      pushDataLayer("template_survey_creation_failed", {
        template_source: source,
        failure_category:
          response.status === 400 || response.status === 422
            ? "validation"
            : response.status === 401 || response.status === 403
              ? "permission"
              : response.status >= 500
                ? "server_error"
                : "http_error",
        http_status: response.status,
      });
    } catch {
      // Analytics must not affect the survey creation result.
    }
    throw await parseV3ApiError(response);
  }

  const body = (await response.json()) as TV3SurveyCreateResponse;
  if (response.status === 201) {
    try {
      pushDataLayer("template_survey_created", {
        template_source: source,
        survey_type: surveyType,
        created_from: source === "custom" ? "blank" : source === "xm" ? "xm-template" : "template",
      });
    } catch {
      // Analytics must not affect the survey creation result.
    }
    pushDataLayer("survey_created", { survey_type: surveyType });
  }
  return body.data;
}
