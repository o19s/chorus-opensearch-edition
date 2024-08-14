FROM golang:bullseye

RUN go install github.com/CtrlSpice/otel-desktop-viewer@latest

CMD ["otel-desktop-viewer", "--browser", "8000", "--host", "0.0.0.0"]
