"use client";

import { useEffect } from "react";
import { ErrorComponent } from "@/modules/ui/components/error-component";
import { pushDataLayer } from "../../../../../../src/lib/data-layer";

export const FeedbackDirectoryListFailure = () => {
  useEffect(() => {
    pushDataLayer("feedback_datasets_view_failed", { failure_category: "server_error" });
  }, []);

  return <ErrorComponent />;
};
