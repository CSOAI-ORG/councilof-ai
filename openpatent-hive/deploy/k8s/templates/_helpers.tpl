{{/*
Expand the name of the chart.
*/}}
{{- define "openpatent-hive.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "openpatent-hive.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Common labels.
*/}}
{{- define "openpatent-hive.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/name: {{ include "openpatent-hive.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: openpatent-hive
hive.openpatent.ai/domain: {{ .Values.global.domain | default "openpatent.ai" }}
{{- end -}}

{{/*
Prometheus scrape annotations for a Python service.
Usage:  include "openpatent-hive.scrape" (dict "ctx" $ "port" 3210)
*/}}
{{- define "openpatent-hive.scrape" -}}
{{- if .ctx.Values.prometheus.enabled -}}
prometheus.io/scrape: "true"
prometheus.io/port: "{{ .port }}"
prometheus.io/path: "/metrics"
{{- end -}}
{{- end -}}
