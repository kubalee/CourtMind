import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { AnalysisStages } from "@/components/analysis/AnalysisStages"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/i18n/LanguageProvider"
import { api } from "@/lib/api"
import type { JobStatusResponse } from "@/types"

interface AnalysisProgressProps {
  status: JobStatusResponse
}

export function AnalysisProgress({ status }: AnalysisProgressProps) {
  const { t } = useLanguage()
  const [stopRequested, setStopRequested] = useState(false)
  const failed = status.status === "failed"
  const completed = status.status === "completed"
  const cancelled = status.status === "cancelled"
  const stopping = status.status === "cancelling" || stopRequested
  const canStop = status.status === "queued" || status.status === "processing"
  const hasFrameProgress = status.total_frames > 0 && !cancelled

  async function stopAnalysis() {
    setStopRequested(true)
    try {
      await api.post(`/jobs/${status.job_id}/cancel`)
    } catch {
      setStopRequested(false)
      toast.error(t("analysis.stopError"))
    }
  }

  return (
    <div className="space-y-5 rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" role="status">
          {!completed && !failed && !cancelled && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <h3 className="text-sm font-semibold">
            {failed ? t("analysis.failed") : completed ? t("analysis.completed") :
              cancelled ? t("analysis.stopped") : stopping ? t("analysis.stopping") : t("analysis.analyzingMatch")}
          </h3>
        </div>
        {hasFrameProgress && (
          <Badge variant={failed ? "destructive" : completed ? "success" : "secondary"}>
            {t("analysis.stageProgress")} {status.progress}%
          </Badge>
        )}
      </div>

      {hasFrameProgress && <Progress value={status.progress} className="h-2" />}

      {!cancelled && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          {hasFrameProgress && (
            <span className="text-muted-foreground">
              {status.current_frame} / {status.total_frames} {t("analysis.frames")}
            </span>
          )}
          <span className="font-medium">
            {stopping ? t("analysis.stoppingHint") : t(`analysis.stage.${status.stage ?? "Analysis"}`)}
          </span>
        </div>
      )}

      {!cancelled && !stopping && (
        <>
          <Separator />
          <AnalysisStages status={status} />
        </>
      )}

      {canStop && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={stopRequested}>{t("analysis.stop")}</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("analysis.stopConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>{t("analysis.stopDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("analysis.keepRunning")}</AlertDialogCancel>
              <AlertDialogAction className={buttonVariants({ variant: "destructive" })}
                onClick={() => void stopAnalysis()}>
                {t("analysis.stop")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {failed && status.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {status.error}
        </p>
      )}
    </div>
  )
}
