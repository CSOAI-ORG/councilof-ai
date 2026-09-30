{{- define "gspc.name" -}}{{ .Values.plugin.name }}{{- end -}}
{{- define "gspc.labels" -}}
app: {{ .Values.plugin.name }}
app.kubernetes.io/name: {{ .Values.plugin.name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: gspc-evidence
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}
