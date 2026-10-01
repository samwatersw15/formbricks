import type { THubFieldType } from "@formbricks/types/feedback-source";
import { pushDataLayer } from "../../../../../../src/lib/data-layer";
import { CSV_IMPORT_FAILED_ERROR_CODE } from "./types";

type TCsvImportApiSuccess = {
  successes: number;
  failures: number;
  skipped: number;
  createdFieldTypes: THubFieldType[];
};

export type TCsvImportApiError = {
  error: string;
  row?: number;
  max?: number;
};

export type TCsvImportApiResult =
  | { data: TCsvImportApiSuccess; error?: never }
  | { data?: never; error: TCsvImportApiError };

const parseCsvImportApiResponse = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const importCsvFile = async ({
  feedbackSourceId,
  workspaceId,
  file,
}: {
  feedbackSourceId: string;
  workspaceId: string;
  file: File;
}): Promise<TCsvImportApiResult> => {
  const formData = new FormData();
  formData.append("feedbackSourceId", feedbackSourceId);
  formData.append("workspaceId", workspaceId);
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch("/api/unify-feedback/sources/csv/import", {
      method: "POST",
      body: formData,
    });
  } catch {
    pushDataLayer("feedback_record_creation_failed", { failure_category: "service_unavailable" });
    return { error: { error: CSV_IMPORT_FAILED_ERROR_CODE } };
  }

  const body = await parseCsvImportApiResponse(response);

  if (!response.ok) {
    const errorBody = body as Partial<TCsvImportApiError> | null;
    const failureCategory =
      response.status === 400 || response.status === 422
        ? "validation"
        : response.status === 401 || response.status === 403
          ? "permission"
          : response.status === 409
            ? "conflict"
            : "service_unavailable";
    pushDataLayer("feedback_record_creation_failed", {
      failure_category: failureCategory,
      http_status: response.status,
    });
    return {
      error: {
        error: errorBody?.error ?? CSV_IMPORT_FAILED_ERROR_CODE,
        row: errorBody?.row,
        max: errorBody?.max,
      },
    };
  }

  const data = body as TCsvImportApiSuccess;
  if (data.successes > 0) {
    pushDataLayer("feedback_record_batch_completed", {
      requested_count: data.successes + data.failures,
      created_count: data.successes,
      failed_count: data.failures,
    });
  } else if (data.failures > 0) {
    pushDataLayer("feedback_record_creation_failed", { failure_category: "service_unavailable" });
  }

  return { data };
};
